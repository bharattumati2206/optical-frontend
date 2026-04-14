import { useEffect, useMemo, useState } from "react";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import CustomerSearchAutocomplete from "../components/common/CustomerSearchAutocomplete";
import InvoiceItemsEditor from "../components/forms/InvoiceItemsEditor";
import PrescriptionForm from "../components/forms/PrescriptionForm";
import { emptyPrescription } from "../constants/prescription";
import { customerService } from "../services/customerService";
import { orderService } from "../services/orderService";
import { prescriptionService } from "../services/prescriptionService";
import { useStore } from "../context/useStore";
import {
  calculateInvoiceTotals,
  createEmptyInvoiceItem,
} from "../utils/invoice";

export default function OrderCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedStore } = useStore();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [latestPrescription, setLatestPrescription] = useState(null);
  const [prescriptionMode, setPrescriptionMode] = useState("reuse");
  const [prescriptionDraft, setPrescriptionDraft] = useState(emptyPrescription);
  const [items, setItems] = useState([
    createEmptyInvoiceItem("FRAME"),
    createEmptyInvoiceItem("LENS"),
  ]);
  const [billing, setBilling] = useState({
    applyDiscount: false,
    applyGst: false,
    discount: 0,
    gstPercent: 18,
    advance: 0,
    paymentType: "CASH",
  });
  const [itemErrors, setItemErrors] = useState({});
  const [customerError, setCustomerError] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrollToElement = (elementId, { focusId, offset = 92 } = {}) => {
    const target = globalThis?.document?.getElementById(elementId);

    if (!target) {
      return;
    }

    const elementTop = target.getBoundingClientRect().top + globalThis.scrollY;
    const scrollTop = Math.max(0, elementTop - offset);

    globalThis.scrollTo({ top: scrollTop, behavior: "smooth" });

    globalThis.setTimeout(() => {
      const focusTarget = focusId
        ? globalThis?.document?.getElementById(focusId)
        : target;
      const focusable =
        focusTarget?.querySelector?.("input, button, [tabindex]") ||
        focusTarget;
      if (typeof focusable?.focus === "function") {
        focusable.focus();
      }
    }, 150);
  };

  const totals = useMemo(
    () =>
      calculateInvoiceTotals({
        items,
        discount: billing.applyDiscount
          ? (items.reduce(
              (sum, item) =>
                sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
              0,
            ) *
              Number(billing.discount || 0)) /
            100
          : 0,
        gstPercent: billing.applyGst ? billing.gstPercent : 0,
        advance: billing.advance,
      }),
    [
      items,
      billing.applyDiscount,
      billing.applyGst,
      billing.discount,
      billing.gstPercent,
      billing.advance,
    ],
  );

  const itemTypeTotals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const amount = Number(item.quantity || 0) * Number(item.unitPrice || 0);
        const type = (item.itemType || "").toUpperCase();

        if (type === "FRAME") {
          acc.frame += amount;
        } else if (type === "LENS") {
          acc.lens += amount;
        } else if (type === "ACCESSORY") {
          acc.accessory += amount;
        }

        return acc;
      },
      { frame: 0, lens: 0, accessory: 0 },
    );
  }, [items]);

  const formatInr = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  const preselectedCustomerId = useMemo(
    () => new URLSearchParams(location.search).get("customerId"),
    [location.search],
  );

  useEffect(() => {
    const customerId = preselectedCustomerId;

    if (!customerId) {
      return;
    }

    let active = true;

    async function prefillCustomer() {
      try {
        const data = await customerService.getCustomerById(customerId);
        if (active) {
          setSelectedCustomer(data);
        }
      } catch {
        if (active) {
          setSelectedCustomer(null);
        }
      }
    }

    prefillCustomer();

    return () => {
      active = false;
    };
  }, [preselectedCustomerId]);

  useEffect(() => {
    if (!selectedCustomer?.id) {
      setLatestPrescription(null);
      return;
    }

    let active = true;

    async function fetchLatestPrescription() {
      try {
        const data = await prescriptionService.getLatestPrescription(
          selectedCustomer.id,
        );
        if (active) {
          setLatestPrescription(data);
          setPrescriptionMode(data ? "reuse" : "new");
        }
      } catch {
        if (active) {
          setLatestPrescription(null);
          setPrescriptionMode("new");
        }
      }
    }

    fetchLatestPrescription();

    return () => {
      active = false;
    };
  }, [selectedCustomer]);

  const handleBillingChange = (event) => {
    const { name, value } = event.target;
    setBilling((prev) => ({ ...prev, [name]: value }));
  };

  const handleBillingFocus = (name) => {
    setBilling((prev) => {
      const value = prev[name];

      if (Number(value) !== 0 || String(value).trim() === "") {
        return prev;
      }

      return { ...prev, [name]: "" };
    });
  };

  const toggleBillingOption = (name) => {
    setBilling((prev) => {
      const nextValue = !prev[name];
      const next = { ...prev, [name]: nextValue };

      if (name === "applyDiscount" && !nextValue) {
        next.discount = 0;
      }

      if (name === "applyGst" && !nextValue) {
        next.gstPercent = 0;
      } else if (
        name === "applyGst" &&
        nextValue &&
        Number(prev.gstPercent) === 0
      ) {
        next.gstPercent = 18;
      }

      return next;
    });
  };

  const validateItems = () => {
    if (!items.length) {
      return {
        message: "Add at least one order item before saving.",
        errors: {},
        firstError: null,
      };
    }

    const nextErrors = {};

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const row = index + 1;

      if (!item?.itemType) {
        nextErrors[index] = { itemType: "Item type is required." };
        return {
          message: `Item ${row}: item type is required.`,
          errors: nextErrors,
          firstError: { index, field: "itemType" },
        };
      }

      if (!String(item?.name || "").trim()) {
        nextErrors[index] = { name: "Item name is required." };
        return {
          message: `Item ${row}: item name is required.`,
          errors: nextErrors,
          firstError: { index, field: "name" },
        };
      }

      if (String(item?.unitPrice ?? "").trim() === "") {
        nextErrors[index] = { unitPrice: "Unit price is required." };
        return {
          message: `Item ${row}: unit price is required.`,
          errors: nextErrors,
          firstError: { index, field: "unitPrice" },
        };
      }

      if (
        Number.isNaN(Number(item?.unitPrice)) ||
        Number(item?.unitPrice) <= 0
      ) {
        nextErrors[index] = { unitPrice: "Unit price must be greater than 0." };
        return {
          message: `Item ${row}: unit price must be greater than 0.`,
          errors: nextErrors,
          firstError: { index, field: "unitPrice" },
        };
      }
    }

    return { message: "", errors: {}, firstError: null };
  };

  const handleSubmit = async () => {
    setCustomerError(false);

    if (!selectedStore?.id) {
      return;
    }

    if (!selectedCustomer?.id) {
      setCustomerError(true);
      scrollToElement("order-customer-section", {
        focusId: "order-customer-field",
      });
      return;
    }

    const itemsValidation = validateItems();
    if (itemsValidation.message) {
      setItemErrors(itemsValidation.errors);

      const firstError = itemsValidation.firstError;
      if (firstError) {
        const fieldIdMap = {
          name: `order-item-${firstError.index}-name`,
          unitPrice: `order-item-${firstError.index}-unitPrice`,
          quantity: `order-item-row-${firstError.index}`,
          itemType: `order-item-row-${firstError.index}`,
        };

        scrollToElement(
          fieldIdMap[firstError.field] || `order-item-row-${firstError.index}`,
        );
      }

      return;
    }

    setItemErrors({});

    setSaving(true);

    try {
      let prescriptionId = latestPrescription?.id || null;

      if (prescriptionMode === "new") {
        const createdPrescription =
          await prescriptionService.createPrescription({
            customerId: selectedCustomer.id,
            ...prescriptionDraft,
          });
        prescriptionId =
          createdPrescription?.id ||
          createdPrescription?.prescriptionId ||
          null;
      }

      const invoicePayload = {
        storeId: selectedStore.id,
        customerId: selectedCustomer.id,
        prescriptionId,
        discount: totals.discount,
        gst: totals.gstAmount,
        advanceAmount: totals.advance,
        paymentType: billing.paymentType,
        items: items.map((item) => ({
          itemType: item.itemType,
          itemName: String(item.name || "").trim(),
          quantity: Number(item.quantity),
          price: Number(item.unitPrice),
        })),
      };

      const createdOrder = await orderService.createOrder(invoicePayload);
      const orderId = createdOrder?.id || createdOrder?.orderId;

      navigate(orderId ? `/orders/${orderId}` : "/orders");
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  };

  const customerDisplayName =
    selectedCustomer?.name || selectedCustomer?.customerName || "";
  const customerPhone =
    selectedCustomer?.phone || selectedCustomer?.mobile || "";
  const customerEmail =
    selectedCustomer?.email || selectedCustomer?.emailAddress || "";

  return (
    <Stack spacing={2.2}>
      <PageHeader
        title="Create Order"
        subtitle="Search customer, attach prescription, add billing items, and save the order."
        action={
          <Button variant="outlined" onClick={() => navigate("/orders")}>
            Back to Orders
          </Button>
        }
      />

      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            id="order-customer-section"
            sx={{
              height: "100%",
              borderRadius: 3,
              border: "1px solid #E3E9F5",
              boxShadow: "0 10px 28px rgba(43, 65, 115, 0.08)",
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Stack spacing={1.8}>
                <SectionCardHeader
                  icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
                  title="Customer"
                  tint="#EEF0FF"
                  color="#5560F6"
                />

                <Stack spacing={0.7}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#5F6D86", fontWeight: 700 }}
                  >
                    Search Customer
                  </Typography>
                  <CustomerSearchAutocomplete
                    value={selectedCustomer}
                    onChange={(value) => {
                      setSelectedCustomer(value);
                      if (value) {
                        setCustomerError(false);
                      }
                    }}
                    label=""
                    placeholder="Search by name or phone..."
                    textFieldProps={{
                      id: "order-customer-field",
                      error: customerError,
                      helperText: customerError ? "Customer is required." : " ",
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.8,
                          backgroundColor: "#FBFCFF",
                        },
                      },
                    }}
                  />
                </Stack>

                {selectedCustomer ? (
                  <Box
                    sx={{
                      borderRadius: 2.3,
                      border: "1px solid #E5EAF8",
                      background:
                        "linear-gradient(180deg, #F6F8FF 0%, #F8FAFF 100%)",
                      px: 1.5,
                      py: 1.4,
                      minHeight: 90,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Stack
                        direction="row"
                        spacing={1.2}
                        alignItems="center"
                        minWidth={0}
                      >
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: "#DDE3FF",
                            color: "#5560F6",
                            fontWeight: 800,
                          }}
                        >
                          {customerDisplayName?.charAt(0) || "C"}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "#24324A",
                            }}
                            noWrap
                          >
                            {customerDisplayName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#6A7892", display: "block" }}
                          >
                            {customerPhone || "-"}
                            {customerEmail ? `  •  ${customerEmail}` : ""}
                          </Typography>
                        </Box>
                      </Stack>

                      {selectedCustomer?.id ? (
                        <Button
                          size="small"
                          variant="outlined"
                          endIcon={
                            <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                          }
                          onClick={() =>
                            navigate(`/customers/${selectedCustomer.id}`)
                          }
                          sx={{
                            flexShrink: 0,
                            borderRadius: 999,
                            borderColor: "#C7D0FF",
                            color: "#5560F6",
                            textTransform: "none",
                            fontWeight: 700,
                          }}
                        >
                          View Details
                        </Button>
                      ) : null}
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            sx={{
              height: "100%",
              borderRadius: 3,
              border: "1px solid #E3E9F5",
              boxShadow: "0 10px 28px rgba(43, 65, 115, 0.08)",
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Stack spacing={1.7}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1.5}
                >
                  <SectionCardHeader
                    icon={<VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                    title="Prescription"
                    tint="#EEF0FF"
                    color="#5560F6"
                  />

                  <TextField
                    select
                    size="small"
                    label="Source"
                    value={prescriptionMode}
                    onChange={(event) =>
                      setPrescriptionMode(event.target.value)
                    }
                    sx={{
                      width: { xs: 116, md: 140 },
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.7,
                        backgroundColor: "#FBFCFF",
                      },
                    }}
                  >
                    <MenuItem value="reuse" disabled={!latestPrescription}>
                      Reuse Latest
                    </MenuItem>
                    <MenuItem value="new">Add New</MenuItem>
                  </TextField>
                </Stack>

                <Box
                  sx={{
                    borderRadius: 2.4,
                    border: "1px solid #E5EAF8",
                    background:
                      "linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 100%)",
                    p: 1.2,
                  }}
                >
                  {prescriptionMode === "reuse" && latestPrescription ? (
                    <PrescriptionPreview prescription={latestPrescription} />
                  ) : (
                    <PrescriptionForm
                      value={prescriptionDraft}
                      onChange={setPrescriptionDraft}
                    />
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Items</Typography>
            <InvoiceItemsEditor
              items={items}
              setItems={setItems}
              itemErrors={itemErrors}
              setItemErrors={setItemErrors}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.8}>
            <SectionCardHeader
              icon={<CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
              title="Billing"
              tint="#EEF0FF"
              color="#5560F6"
            />

            <Grid container spacing={1.4} alignItems="stretch">
              <Grid size={{ xs: 12, lg: 8.2 }}>
                <Box
                  sx={{
                    border: "1px solid #DFE5F1",
                    borderRadius: 2,
                    backgroundColor: "#F8FAFF",
                    p: 1.5,
                  }}
                >
                  <Stack spacing={1.4}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Payment Mode"
                      name="paymentType"
                      value={billing.paymentType}
                      onChange={handleBillingChange}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.6,
                          backgroundColor: "#FFFFFF",
                        },
                      }}
                    >
                      <MenuItem value="CASH">Cash</MenuItem>
                      <MenuItem value="CARD">Card</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                    </TextField>

                    <Divider sx={{ borderColor: "#E3E8F3" }} />

                    <Grid container spacing={1.4}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.8 }}
                        >
                          <Typography
                            sx={{ fontWeight: 700, color: "#33415C" }}
                          >
                            Discount
                          </Typography>
                          <Switch
                            checked={billing.applyDiscount}
                            onChange={() =>
                              toggleBillingOption("applyDiscount")
                            }
                            size="small"
                          />
                        </Stack>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Discount %"
                          name="discount"
                          value={billing.discount}
                          onChange={handleBillingChange}
                          onFocus={() => handleBillingFocus("discount")}
                          disabled={!billing.applyDiscount}
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  %
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.8 }}
                        >
                          <Typography
                            sx={{ fontWeight: 700, color: "#33415C" }}
                          >
                            GST
                          </Typography>
                          <Switch
                            checked={billing.applyGst}
                            onChange={() => toggleBillingOption("applyGst")}
                            size="small"
                          />
                        </Stack>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="GST Percentage"
                          name="gstPercent"
                          value={billing.gstPercent}
                          onChange={handleBillingChange}
                          disabled={!billing.applyGst}
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  %
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography
                          sx={{ fontWeight: 700, color: "#33415C", mb: 1.2 }}
                        >
                          Advance
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="text"
                          label="Advance Amount"
                          name="advance"
                          value={billing.advance}
                          onChange={handleBillingChange}
                          onFocus={() => handleBillingFocus("advance")}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  ₹
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, lg: 3.8 }}>
                <Box
                  sx={{
                    height: "100%",
                    border: "1px solid #9FE5CF",
                    borderLeft: "4px solid #11B884",
                    borderRadius: 2,
                    backgroundColor: "#E9FBF4",
                    px: 1.7,
                    py: 1.5,
                  }}
                >
                  <Stack spacing={0.7}>
                    <BillingSummaryRow
                      label="Subtotal"
                      value={formatInr(totals.subtotal)}
                    />
                    <BillingSummaryRow
                      label="Discount"
                      value={`- ${formatInr(totals.discount)}`}
                    />
                    <BillingSummaryRow
                      label="GST"
                      value={`+ ${formatInr(totals.gstAmount)}`}
                    />
                    <BillingSummaryRow
                      label="Advance"
                      value={`- ${formatInr(totals.advance)}`}
                    />
                    <Divider sx={{ my: 0.6, borderColor: "#C2EBDD" }} />
                    <BillingSummaryRow
                      label="Frame Total"
                      value={formatInr(itemTypeTotals.frame)}
                    />
                    <BillingSummaryRow
                      label="Lens Total"
                      value={formatInr(itemTypeTotals.lens)}
                    />
                    <BillingSummaryRow
                      label="Accessories"
                      value={formatInr(itemTypeTotals.accessory)}
                    />
                  </Stack>
                  <Divider sx={{ my: 1.1, borderColor: "#C2EBDD" }} />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      sx={{ fontWeight: 800, color: "#1B3A2F", fontSize: 20 }}
                    >
                      Grand Total
                    </Typography>
                    <Typography
                      sx={{ fontWeight: 800, color: "#10A974", fontSize: 22 }}
                    >
                      {formatInr(totals.total)}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="outlined" onClick={() => navigate("/orders")}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save Order"}
        </Button>
      </Stack>
    </Stack>
  );
}

function SectionCardHeader({ icon, title, tint, color }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar
        sx={{
          width: 28,
          height: 28,
          bgcolor: tint,
          color,
        }}
      >
        {icon}
      </Avatar>
      <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#24324A" }}>
        {title}
      </Typography>
    </Stack>
  );
}

function BillingSummaryRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{ color: "#2F5A4C", fontSize: 15, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ color: "#224B3D", fontSize: 16, fontWeight: 700 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function PrescriptionPreview({ prescription }) {
  const previewColumns = "1.25fr repeat(4, 1fr)";
  const rows = [
    {
      label: "RIGHT (OD)",
      color: "#5560F6",
      tint: "#EEF0FF",
      values: [
        prescription?.rightEyeSph || "-",
        prescription?.rightEyeCyl || "-",
        prescription?.rightEyeAxis || "-",
        prescription?.additionPower || "+1.00",
      ],
    },
    {
      label: "LEFT (OS)",
      color: "#0EA47A",
      tint: "#E8FAF4",
      values: [
        prescription?.leftEyeSph || "-",
        prescription?.leftEyeCyl || "-",
        prescription?.leftEyeAxis || "-",
        prescription?.additionPower || "+1.00",
      ],
    },
  ];

  const headers = ["Eye", "SPH", "CYL", "AXIS", "ADD"];

  return (
    <Stack spacing={1.4}>
      <Typography variant="body2" sx={{ color: "#5F6D86", fontWeight: 700 }}>
        Latest prescription snapshot
      </Typography>

      <Box
        sx={{
          border: "1px solid #DEE5F2",
          borderRadius: 2,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: previewColumns,
              backgroundColor: "#EDF2FB",
              borderBottom: "1px solid #DEE5F2",
            }}
          >
            {headers.map((header, index) => (
              <Box
                key={header}
                sx={{
                  px: 1.4,
                  py: 1,
                  borderRight:
                    index === headers.length - 1 ? "none" : "1px solid #DEE5F2",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "#60708A", fontWeight: 700 }}
                >
                  {header}
                </Typography>
              </Box>
            ))}
          </Box>

          {rows.map((row, rowIndex) => (
            <Box
              key={row.label}
              sx={{
                display: "grid",
                gridTemplateColumns: previewColumns,
                borderTop: rowIndex === 0 ? "none" : "1px solid #DEE5F2",
              }}
            >
              <Box
                sx={{
                  px: 1.2,
                  py: 1,
                  borderRight: "1px solid #DEE5F2",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 34,
                    px: 1.2,
                    borderRadius: 1.5,
                    backgroundColor: row.tint,
                    color: row.color,
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {row.label}
                </Box>
              </Box>

              {row.values.map((cellValue, index) => (
                <Box
                  key={`${row.label}-${headers[index + 1]}`}
                  sx={{
                    minHeight: 49,
                    px: 1.2,
                    display: "flex",
                    alignItems: "center",
                    borderRight:
                      index === row.values.length - 1
                        ? "none"
                        : "1px solid #DEE5F2",
                    color: "#33415C",
                    fontWeight: 600,
                  }}
                >
                  {cellValue}
                </Box>
              ))}
            </Box>
          ))}
        </Box>

        <Stack spacing={1} sx={{ p: 1.2, display: { xs: "flex", md: "none" } }}>
          {rows.map((row) => (
            <Grid container spacing={1} alignItems="center" key={row.label}>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 34,
                    px: 1.2,
                    borderRadius: 1.5,
                    backgroundColor: row.tint,
                    color: row.color,
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {row.label}
                </Box>
              </Grid>

              {row.values.map((cellValue, index) => (
                <Grid
                  key={`${row.label}-${headers[index + 1]}`}
                  size={{ xs: 6 }}
                >
                  <Box
                    sx={{
                      minHeight: 36,
                      px: 1.2,
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #DCE4F2",
                      borderRadius: 1.5,
                      backgroundColor: "#fff",
                      color: "#33415C",
                      fontWeight: 600,
                    }}
                  >
                    {cellValue}
                  </Box>
                </Grid>
              ))}
            </Grid>
          ))}
        </Stack>
      </Box>

      <Grid container spacing={1.2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#60708A",
              fontWeight: 700,
              display: "block",
              mb: 0.5,
            }}
          >
            PD
          </Typography>
          <Box
            sx={{
              minHeight: 36,
              px: 1.2,
              display: "flex",
              alignItems: "center",
              border: "1px solid #DCE4F2",
              borderRadius: 1.5,
              backgroundColor: "#fff",
              color: "#33415C",
              fontWeight: 600,
            }}
          >
            {prescription?.pd || "-"}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#60708A",
              fontWeight: 700,
              display: "block",
              mb: 0.5,
            }}
          >
            Remarks
          </Typography>
          <Box
            sx={{
              minHeight: 36,
              px: 1.2,
              display: "flex",
              alignItems: "center",
              border: "1px solid #DCE4F2",
              borderRadius: 1.5,
              backgroundColor: "#fff",
              color: prescription?.remarks ? "#33415C" : "#93A0B8",
              fontWeight: 500,
            }}
          >
            {prescription?.remarks ||
              "No remarks added for the latest prescription."}
          </Box>
        </Grid>
      </Grid>
    </Stack>
  );
}

SectionCardHeader.propTypes = {
  color: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  tint: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

PrescriptionPreview.propTypes = {
  prescription: PropTypes.shape({
    additionPower: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    leftEyeAxis: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    leftEyeCyl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    leftEyeSph: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pd: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    prescriptionType: PropTypes.string,
    remarks: PropTypes.string,
    rightEyeAxis: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rightEyeCyl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rightEyeSph: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};

BillingSummaryRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
