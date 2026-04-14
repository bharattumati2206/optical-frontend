import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import PrescriptionForm from "../components/forms/PrescriptionForm";
import { emptyPrescription } from "../constants/prescription";
import { customerService } from "../services/customerService";
import { orderService } from "../services/orderService";
import { prescriptionService } from "../services/prescriptionService";
import { getListData } from "../utils/api";

function mapOrderRows(payload) {
  return getListData(payload).map((item, index) => ({
    id: item.id || index,
    orderNumber: item.orderNumber || item.orderNo || "-",
    date: item.orderDate || item.date || "-",
    amount: item.finalAmount || item.totalAmount || item.amount || 0,
    status: item.paymentStatus || "UNPAID",
  }));
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionDraft, setPrescriptionDraft] = useState(emptyPrescription);
  const [error, setError] = useState("");
  const [savingPrescription, setSavingPrescription] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      setError("");

      const [customerRes, invoicesRes, prescriptionsRes] =
        await Promise.allSettled([
          customerService.getCustomerById(customerId),
          orderService.getOrders({ customerId, page: 0, size: 20 }),
          prescriptionService.getCustomerPrescriptions(customerId),
        ]);

      if (!active) {
        return;
      }

      if (customerRes.status === "fulfilled") {
        setCustomer(customerRes.value);
      }

      if (invoicesRes.status === "fulfilled") {
        setOrders(mapOrderRows(invoicesRes.value));
      }

      if (prescriptionsRes.status === "fulfilled") {
        setPrescriptions(getListData(prescriptionsRes.value));
      }

      if (customerRes.status === "rejected") {
        setError("Unable to load customer details.");
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [customerId]);

  const latestPrescription = useMemo(
    () => prescriptions[0] || null,
    [prescriptions],
  );

  const handleSavePrescription = async () => {
    setSavingPrescription(true);
    setError("");

    try {
      const created = await prescriptionService.createPrescription({
        customerId: Number(customerId),
        ...prescriptionDraft,
      });

      setPrescriptions((prev) => [created, ...prev]);
      setPrescriptionDraft(emptyPrescription);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to create prescription.",
      );
    } finally {
      setSavingPrescription(false);
    }
  };

  return (
    <Stack spacing={2.2}>
      <PageHeader
        title={customer?.name || customer?.customerName || "Customer Detail"}
        subtitle="Customer profile, prescriptions, and order history in one place."
        action={
          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              to={`/orders/new?customerId=${customerId}`}
              variant="contained"
              startIcon={<ReceiptLongRoundedIcon />}
            >
              Create Order
            </Button>
          </Stack>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.2}>
                <Typography variant="h6">Customer Info</Typography>
                <InfoRow
                  label="Phone"
                  value={customer?.phone || customer?.mobile || "-"}
                />
                <InfoRow label="Email" value={customer?.email || "-"} />
                <InfoRow label="Age" value={customer?.age || "-"} />
                <InfoRow label="Gender" value={customer?.gender || "-"} />
                <InfoRow label="Address" value={customer?.address || "-"} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Last Recorded Prescription</Typography>
                {latestPrescription ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <InfoRow
                        label="Right"
                        value={`${latestPrescription.rightEyeSph || "-"} / ${latestPrescription.rightEyeCyl || "-"} / ${latestPrescription.rightEyeAxis || "-"}`}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <InfoRow
                        label="Left"
                        value={`${latestPrescription.leftEyeSph || "-"} / ${latestPrescription.leftEyeCyl || "-"} / ${latestPrescription.leftEyeAxis || "-"}`}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <InfoRow
                        label="PD"
                        value={latestPrescription.pd || "-"}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <InfoRow
                        label="Recorded On"
                        value={formatDateTime(latestPrescription.createdAt)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <InfoRow
                        label="Remarks"
                        value={
                          latestPrescription.remarks ||
                          latestPrescription.remark ||
                          "-"
                        }
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <Typography color="text.secondary">
                    No prescription found for this customer yet.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Add Prescription</Typography>
            </Stack>
            <PrescriptionForm
              value={prescriptionDraft}
              onChange={setPrescriptionDraft}
            />
            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={handleSavePrescription}
                disabled={savingPrescription}
              >
                {savingPrescription ? "Saving..." : "Save Prescription"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Prescription History</Typography>
                <Divider />
                {prescriptions.length ? (
                  prescriptions.map((item, index) => (
                    <Stack key={item.id || index} spacing={0.4}>
                      <Typography fontWeight={600}>
                        Prescription #{item.id || index + 1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Right: {item.rightEyeSph || "-"} /{" "}
                        {item.rightEyeCyl || "-"} / {item.rightEyeAxis || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Left: {item.leftEyeSph || "-"} /{" "}
                        {item.leftEyeCyl || "-"} / {item.leftEyeAxis || "-"}
                      </Typography>
                    </Stack>
                  ))
                ) : (
                  <Typography color="text.secondary">
                    Prescription history is empty.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Past Orders</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order No.</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          onClick={() => navigate(`/orders/${row.id}`)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell>{row.orderNumber}</TableCell>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>{row.amount}</TableCell>
                          <TableCell>{row.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack spacing={0.2}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}
