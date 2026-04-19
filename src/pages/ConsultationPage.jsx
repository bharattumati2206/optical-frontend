import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import PageHeader from "../components/common/PageHeader";
import ConsultationPreviewCard from "../components/common/ConsultationPreviewCard";
import CustomerSearchAutocomplete from "../components/common/CustomerSearchAutocomplete";
import { consultationService } from "../services/consultationService";
import apiClient from "../services/apiClient";
import { CONSULTATION_TYPES } from "../constants/consultationTypes";
import { getListData } from "../utils/api";
import { useStore } from "../context/useStore";

const PAYMENT_MODES = ["CASH", "UPI", "CARD"];

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapConsultations(payload) {
  return getListData(payload)
    .map((item, index) => ({
      id: item.id || index,
      consultationDate: item.consultationDate || item.createdAt || "",
      customerName: item.customer?.name || item.customerName || "-",
      consultationFee: item.consultationFee ?? 0,
      paymentMode: item.paymentMode || "-",
      paymentStatus: item.paymentStatus || "-",
    }))
    .sort((a, b) => new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime());
}

function getLatestConsultationDate(rows) {
  const timestamps = rows
    .map((row) => row.consultationDate || row.createdAt || row.date)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps));
}

function getDaysSince(date) {
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startToday.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function buildPreview(historyRows) {
  const latestDate = getLatestConsultationDate(historyRows);

  if (!latestDate) {
    return {
      isFreeFlow: false,
      lastVisitDate: null,
      daysSinceLastVisit: null,
      followupValidUntil: null,
      effectiveFee: Number(FEE_OPTIONS[0].value),
      severity: "warning",
      message: "First consultation for this customer. Paid consultation applicable.",
    };
  }

  const daysSinceLastVisit = getDaysSince(latestDate);
  const followupValidUntil = addDays(latestDate, FREE_WINDOW_DAYS);
  const isFreeFlow = daysSinceLastVisit <= FREE_WINDOW_DAYS;

  return {
    isFreeFlow,
    lastVisitDate: latestDate.toISOString(),
    daysSinceLastVisit,
    followupValidUntil: followupValidUntil.toISOString(),
    effectiveFee: isFreeFlow ? 0 : Number(FEE_OPTIONS[0].value),
    severity: isFreeFlow ? "success" : "warning",
    message: isFreeFlow
      ? "Free follow-up valid within 15 days."
      : "Follow-up window expired. Consultation fee applicable.",
  };
}

function getFriendlyApiError(err, fallback) {
  const status = err?.response?.status;
  if (status === 403) {
    return "You are not allowed to perform this action.";
  }
  if (status === 404) {
    return "Customer or store not found.";
  }
  if (status === 400) {
    return err?.response?.data?.message || "Validation failed. Please verify input.";
  }
  return err?.response?.data?.message || fallback;
}

function getPreviewEffectiveFee(isFreeFlow, feeOption, customFee) {
  if (isFreeFlow) {
    return 0;
  }

  if (feeOption === "CUSTOM") {
    return Number(customFee || 0);
  }

  return Number(feeOption || FEE_OPTIONS[0].value);
}


export default function ConsultationPage() {
  const { selectedStore, isSuperAdmin, loadingStores } = useStore();

  // State for new case-based logic
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [consultationType, setConsultationType] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [fee, setFee] = useState(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [saving, setSaving] = useState(false);

  // Other state
  const [consultations, setConsultations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [flowFilter, setFlowFilter] = useState("ALL");
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().split('T')[0]);

  // (history panel state removed, not needed for new case-based UI)
  // Fetch case details when customer or type changes
  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (!selectedCustomer || !consultationType) {
        setCaseData(null);
        setFee(0);
        return;
      }
      try {
        const res = await apiClient.get("/consultations/check-case", {
          params: {
            customerId: selectedCustomer.id,
            type: consultationType.value,
          },
        });
        setCaseData(res.data);
        setFee(res.data.fee);
      } catch (err) {
        setCaseData(null);
        setFee(0);
      }
    };
    fetchCaseDetails();
  }, [selectedCustomer, consultationType]);

  useEffect(() => {
    if (isSuperAdmin && loadingStores) {
      return;
    }

    let active = true;
    setListLoading(true);
    setListError("");

    const params = {};
    if (isSuperAdmin && selectedStore?.id) {
      params.storeId = selectedStore.id;
    }

    consultationService
      .getConsultations(params)
      .then((data) => {
        if (active) {
          setConsultations(mapConsultations(data));
        }
      })
      .catch((err) => {
        if (active) {
          setListError(getFriendlyApiError(err, "Unable to load consultations."));
        }
      })
      .finally(() => {
        if (active) {
          setListLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isSuperAdmin, loadingStores, selectedStore?.id]);


  // Legacy selectedCustomerId and related logic removed (now handled by selectedCustomer)

  const filteredConsultations = useMemo(() => {
    if (flowFilter === "FREE") {
      return consultations.filter((row) => row.isFreeFollowup);
    }
    if (flowFilter === "PAID") {
      return consultations.filter((row) => !row.isFreeFollowup);
    }
    return consultations;
  }, [consultations, flowFilter]);


  // (historyPanelContent removed, not needed for new case-based UI)

  async function refreshConsultations() {
    const params = {};
    if (isSuperAdmin && selectedStore?.id) {
      params.storeId = selectedStore.id;
    }
    const data = await consultationService.getConsultations(params);
    setConsultations(mapConsultations(data));
  }

  async function handleSubmit() {
    // Inline button disables, so no canSubmit needed
    if (!selectedCustomer || !consultationType || saving || (fee > 0 && !paymentMode)) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        customerId: selectedCustomer?.id,
        consultationType: consultationType?.value,
        consultationFee: fee,
        consultationDate,
      };

      if (isSuperAdmin && selectedStore?.id) {
        payload.storeId = selectedStore.id;
      }

      if (fee > 0) {
        payload.paymentMode = paymentMode;
      }

      const response = await consultationService.createConsultation(payload);
      const saved = response?.data ?? response;

      await refreshConsultations();

      const savedSummary = [
        saved?.isFreeFollowup ? "Free follow-up recorded" : "Paid consultation recorded",
        `Fee: Rs ${saved?.consultationFee ?? payload.consultationFee ?? 0}`,
        `Status: ${saved?.paymentStatus || "-"}`,
        `Mode: ${saved?.paymentMode || "-"}`,
        `Visit: ${saved?.visitType || "-"}`,
        `Date: ${formatDateTime(saved?.consultationDate)}`,
      ].join(" | ");

      setSnackbar({
        open: true,
        severity: "success",
        message: savedSummary,
      });

      setSelectedCustomer(null);
      setConsultationType(null);
      setCaseData(null);
      setFee(0);
      setPaymentMode("CASH");
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: getFriendlyApiError(err, "Failed to save consultation."),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader title="Consultations" subtitle="Clinic consultation billing" />

      {/* --- New UI: Consultation Type Selection and Case Status --- */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
        <Card variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack spacing={2}>
              {/* Consultation Type Selection */}
              <Autocomplete
                options={CONSULTATION_TYPES}
                getOptionLabel={(option) => option.label}
                value={consultationType}
                onChange={(_, value) => setConsultationType(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Consultation Type" required fullWidth />
                )}
                sx={{ mb: 2 }}
                disableClearable
              />
              {/* Customer Selection */}
              <CustomerSearchAutocomplete
                value={selectedCustomer}
                onChange={(customer) => setSelectedCustomer(customer)}
                label="Customer"
                placeholder="Search by name or phone"
              />
              {isSuperAdmin && (
                <TextField
                  label="Consultation Date"
                  type="date"
                  value={consultationDate}
                  onChange={(event) => setConsultationDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      backgroundColor: '#fff',
                    },
                  }}
                />
              )}
              {/* Customer Info */}
              {selectedCustomer ? (
                <Box sx={{ bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200", borderRadius: 1.5, px: 1.5, py: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{selectedCustomer.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedCustomer.phone}</Typography>
                </Box>
              ) : null}
              {/* Case Status Card */}
              {consultationType && selectedCustomer && (
                <Card variant="outlined" sx={{ mt: 2, mb: 1 }}>
                  <CardContent>
                    {caseData ? (
                      <Stack spacing={0.5}>
                        {caseData.caseStatus === "ACTIVE" && (
                          <>
                            <Typography color="success.main" fontWeight={600}>Follow-up Case Active</Typography>
                            <Typography variant="body2">Last Visit: {formatDate(caseData.lastVisitDate)}</Typography>
                            <Typography variant="body2">Valid Till: {formatDate(caseData.validTill)}</Typography>
                            <Typography variant="body2">Days Remaining: {caseData.daysRemaining}</Typography>
                            <Typography variant="body2">Fee: FREE</Typography>
                          </>
                        )}
                        {caseData.caseStatus === "EXPIRED" && (
                          <>
                            <Typography color="error.main" fontWeight={600}>Previous Case Expired</Typography>
                            <Typography variant="body2">Last Visit: {formatDate(caseData.lastVisitDate)}</Typography>
                            <Typography variant="body2">Expired On: {formatDate(caseData.validTill)}</Typography>
                            <Typography variant="body2">New Consultation Required</Typography>
                            <Typography variant="body2">Fee: ₹{caseData.fee}</Typography>
                          </>
                        )}
                        {caseData.caseStatus === "NEW" && (
                          <>
                            <Typography color="warning.main" fontWeight={600}>New Consultation</Typography>
                            <Typography variant="body2">No previous case found</Typography>
                            <Typography variant="body2">Fee: ₹{caseData.fee}</Typography>
                          </>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Checking case status...</Typography>
                    )}
                  </CardContent>
                </Card>
              )}
            </Stack>
          </CardContent>
        </Card>
        {/* Billing & Payment Section */}
        <Card variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocalHospitalRoundedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={600}>Consultation Billing</Typography>
              </Stack>
              {/* Fee Display */}
              <Typography variant="h6" fontWeight={600}>
                Effective Fee: {fee === 0 ? "FREE" : `₹${fee}`}
              </Typography>
              {/* Payment Section */}
              {fee === 0 ? (
                <Alert severity="info">No payment required for follow-up</Alert>
              ) : (
                <FormControl>
                  <FormLabel sx={{ fontSize: "0.8rem", mb: 0.5 }}>Payment Mode</FormLabel>
                  <RadioGroup
                    row
                    value={paymentMode}
                    onChange={(event) => setPaymentMode(event.target.value)}
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <FormControlLabel
                        key={mode}
                        value={mode}
                        control={<Radio size="small" />}
                        label={mode}
                        sx={{ mr: 1.5 }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
              {isSuperAdmin && !selectedStore?.id ? (
                <Alert severity="warning">Select a store in the top bar before saving.</Alert>
              ) : null}
              <Button
                variant="contained"
                disabled={
                  !selectedCustomer || !consultationType || saving || (fee > 0 && !paymentMode)
                }
                onClick={handleSubmit}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {saving ? "Saving..." : fee === 0 ? "Save Consultation" : "Collect Fee & Save"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Divider />

      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
          <Typography variant="h6" fontWeight={600}>
            Consultation List
          </Typography>
          <TextField
            select
            size="small"
            label="Quick Filter"
            value={flowFilter}
            onChange={(event) => setFlowFilter(event.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="FREE">Free only</MenuItem>
            <MenuItem value="PAID">Paid only</MenuItem>
          </TextField>
        </Stack>

        {listError ? <Alert severity="error">{listError}</Alert> : null}

        {listLoading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Card variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Payment Mode</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredConsultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: "text.secondary", py: 3 }}>
                        No consultations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConsultations.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{formatDate(row.consultationDate)}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>Rs {row.consultationFee}</TableCell>
                        <TableCell>{row.paymentMode}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ mt: 5, whiteSpace: "pre-line" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
