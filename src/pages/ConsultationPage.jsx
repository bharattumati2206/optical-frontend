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
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import PageHeader from "../components/common/PageHeader";
import ConsultationPreviewCard from "../components/common/ConsultationPreviewCard";
import CustomerSearchAutocomplete from "../components/common/CustomerSearchAutocomplete";
import { consultationService } from "../services/consultationService";
import { getListData } from "../utils/api";
import { useStore } from "../context/useStore";

const PAYMENT_MODES = ["CASH", "UPI", "CARD"];
const FREE_WINDOW_DAYS = 15;
const FEE_OPTIONS = [
  { label: "Comprehensive Consultation", value: 500 },
  { label: "Pediatric consultation", value: 750 },
  { label: "Speciality Consultation", value: 1000 },
  { label: "Foreign Body removal", value: 300 },
  { label: "Diagnostic - each eye", value: 1250 },
  { label: "Surgical Profile", value: 2500 },
  { label: "Others - custom amount", value: "CUSTOM" },
];

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
      consultationDate: item.consultationDate || item.createdAt || item.date || "",
      customerName: item.customerName || item.customer?.name || "-",
      consultationFee: item.consultationFee ?? item.fee ?? 0,
      paymentMode: item.paymentMode ?? null,
      paymentStatus: item.paymentStatus || "-",
      visitType: item.visitType || "-",
      isFreeFollowup: Boolean(item.isFreeFollowup),
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
  const feeInputRef = useRef(null);
  const { selectedStore, isSuperAdmin, loadingStores } = useStore();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [consultationPreview, setConsultationPreview] = useState(null);

  const [feeOption, setFeeOption] = useState("");
  const [customFee, setCustomFee] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [saving, setSaving] = useState(false);

  const [consultations, setConsultations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [flowFilter, setFlowFilter] = useState("ALL");

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

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

  useEffect(() => {
    if (!selectedCustomerId) {
      setHistoryRows([]);
      setConsultationPreview(null);
      setHistoryError("");
      setFeeOption("");
      setCustomFee("");
      setPaymentMode("CASH");
      return;
    }

    let active = true;
    setHistoryLoading(true);
    setHistoryError("");

    consultationService
      .getConsultationsByCustomer(selectedCustomerId)
      .then((data) => {
        if (!active) {
          return;
        }

        const rows = mapConsultations(data);
        const preview = buildPreview(rows);

        setHistoryRows(rows);
        setConsultationPreview(preview);

        setFeeOption("");
        setCustomFee("");
        setPaymentMode("CASH");
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        setHistoryRows([]);
        setConsultationPreview({
          ...buildPreview([]),
          message: "Unable to evaluate follow-up from history. Treating as paid by default.",
        });
        setHistoryError(getFriendlyApiError(err, "Unable to load customer consultation history."));
      })
      .finally(() => {
        if (active) {
          setHistoryLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedCustomerId, selectedStore?.id]);

  useEffect(() => {
    if (feeOption === "CUSTOM") {
      setTimeout(() => {
        feeInputRef.current?.focus();
      }, 60);
    }
  }, [feeOption]);

  const isFreeFlow = Boolean(consultationPreview?.isFreeFlow);
  const storeReady = !isSuperAdmin || Boolean(selectedStore?.id);

  const selectedFee = feeOption === "CUSTOM" ? Number(customFee) : Number(feeOption || 0);

  const previewEffectiveFee = getPreviewEffectiveFee(
    Boolean(consultationPreview?.isFreeFlow),
    feeOption,
    customFee,
  );

  const previewToRender = consultationPreview
    ? { ...consultationPreview, effectiveFee: previewEffectiveFee }
    : null;

  const canSubmit =
    Boolean(selectedCustomerId) &&
    storeReady &&
    !historyLoading &&
    !saving &&
    (isFreeFlow || (Boolean(feeOption) && Number.isFinite(selectedFee) && selectedFee > 0 && Boolean(paymentMode)));

  const filteredConsultations = useMemo(() => {
    if (flowFilter === "FREE") {
      return consultations.filter((row) => row.isFreeFollowup);
    }
    if (flowFilter === "PAID") {
      return consultations.filter((row) => !row.isFreeFollowup);
    }
    return consultations;
  }, [consultations, flowFilter]);

  let historyPanelContent = null;
  if (historyLoading) {
    historyPanelContent = (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={16} />
        <Typography variant="caption">Loading history...</Typography>
      </Stack>
    );
  } else if (historyRows.length === 0) {
    historyPanelContent = (
      <Typography variant="caption" color="text.secondary">
        No previous consultations found.
      </Typography>
    );
  } else {
    historyPanelContent = (
      <>
        <Typography variant="caption" color="text.secondary">
          Last consultation on {formatDate(historyRows[0]?.consultationDate)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Free follow-up valid until {formatDate(addDays(new Date(historyRows[0]?.consultationDate), FREE_WINDOW_DAYS))}
        </Typography>
        {historyRows.slice(0, 3).map((row) => (
          <Stack
            key={row.id}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ borderTop: "1px solid", borderColor: "divider", pt: 0.8 }}
          >
            <Typography variant="caption">{formatDate(row.consultationDate)}</Typography>
            <Typography variant="caption">{row.visitType}</Typography>
            <Typography variant="caption">Rs {row.consultationFee}</Typography>
            <Chip
              size="small"
              label={row.isFreeFollowup ? "Free Follow-up" : "Paid"}
              color={row.isFreeFollowup ? "success" : "default"}
            />
          </Stack>
        ))}
      </>
    );
  }

  async function refreshConsultations() {
    const params = {};
    if (isSuperAdmin && selectedStore?.id) {
      params.storeId = selectedStore.id;
    }
    const data = await consultationService.getConsultations(params);
    setConsultations(mapConsultations(data));
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        customerId: selectedCustomerId,
        consultationFee: isFreeFlow ? 0 : selectedFee,
      };

      if (isSuperAdmin && selectedStore?.id) {
        payload.storeId = selectedStore.id;
      }

      if (!isFreeFlow) {
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

      setSelectedCustomerId("");
      setSelectedCustomer(null);
      setHistoryRows([]);
      setConsultationPreview(null);
      setHistoryError("");
      setFeeOption("");
      setCustomFee("");
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

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
        <Card variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonRoundedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Select Customer
                </Typography>
              </Stack>

              <CustomerSearchAutocomplete
                value={selectedCustomer}
                onChange={(customer) => {
                  setSelectedCustomer(customer);
                  setSelectedCustomerId(customer?.id || "");
                }}
                label="Customer"
                placeholder="Search by name or phone"
              />

              {selectedCustomer ? (
                <Box
                  sx={{
                    bgcolor: "primary.50",
                    border: "1px solid",
                    borderColor: "primary.200",
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {selectedCustomer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedCustomer.phone}
                  </Typography>
                </Box>
              ) : null}

              {historyError ? <Alert severity="warning">{historyError}</Alert> : null}

              {selectedCustomerId ? (
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Customer Consultation History
                      </Typography>
                      {historyPanelContent}
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocalHospitalRoundedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Consultation Billing
                </Typography>
              </Stack>

              <ConsultationPreviewCard loading={historyLoading} preview={selectedCustomerId ? previewToRender : null} />

              {isFreeFlow ? (
                <TextField
                  label="Consultation Fee"
                  type="number"
                  size="small"
                  value="0"
                  disabled
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                      readOnly: true,
                    },
                  }}
                />
              ) : (
                <FormControl size="small" fullWidth>
                  <InputLabel>Consultation Type</InputLabel>
                  <Select
                    value={feeOption}
                    label="Consultation Type"
                    onChange={(event) => {
                      setFeeOption(event.target.value);
                      if (event.target.value !== "CUSTOM") {
                        setCustomFee("");
                      }
                    }}
                  >
                    {FEE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                        {option.value === "CUSTOM" ? "" : ` - Rs ${option.value}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {!isFreeFlow && feeOption === "CUSTOM" ? (
                <TextField
                  inputRef={feeInputRef}
                  label="Custom Amount"
                  type="number"
                  size="small"
                  value={customFee}
                  onChange={(event) => setCustomFee(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                    },
                  }}
                />
              ) : null}

              {isFreeFlow ? (
                <Alert severity="info">Payment mode is not required for free follow-up.</Alert>
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
                disabled={!canSubmit}
                onClick={handleSubmit}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {saving ? "Saving..." : "Collect Fee & Save"}
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
                    <TableCell sx={{ fontWeight: 600 }}>Visit Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Payment Mode</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Follow-up Tag</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredConsultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>
                        No consultations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConsultations.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{formatDate(row.consultationDate)}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{row.visitType}</TableCell>
                        <TableCell>Rs {row.consultationFee ?? 0}</TableCell>
                        <TableCell>{row.paymentMode || "-"}</TableCell>
                        <TableCell>{row.paymentStatus || "-"}</TableCell>
                        <TableCell>
                          {row.isFreeFollowup ? (
                            <Chip size="small" color="success" label="Free Follow-up" />
                          ) : (
                            <Chip size="small" color="default" label="Paid" />
                          )}
                        </TableCell>
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
