import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import { orderService } from "../services/orderService";
import { getListData } from "../utils/api";

function getPaymentStatusColor(status) {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
    case "PAID":
      return "success";
    case "PARTIAL":
      return "warning";
    case "PENDING":
    case "UNPAID":
      return "error";
    default:
      return "default";
  }
}

function getOrderStatusColor(status) {
  switch (status?.toUpperCase()) {
    case "NEW":
      return "default";
    case "IN_PROGRESS":
      return "info";
    case "READY":
      return "warning";
    case "DELIVERED":
      return "success";
    case "CANCELLED":
      return "error";
    default:
      return "default";
  }
}

function mapOrders(payload) {
  const list = getListData(payload);

  return list.map((item, index) => ({
    id: item.id || index,
    orderNumber: item.orderNumber || item.orderNo || "-",
    customerName: item.customerName || item.customer?.name || "-",
    date: item.orderDate || item.date || "-",
    amount: item.finalAmount || item.totalAmount || item.amount || 0,
    paymentStatus: item.paymentStatus || "PENDING",
    orderStatus: item.orderStatus || "NEW",
  }));
}

function getPaginationMeta(payload, fallbackPage) {
  const totalElements = Number(payload?.totalElements);
  const totalPages = Number(payload?.totalPages);
  const currentPage = Number(payload?.page);
  const hasNext = Boolean(payload?.hasNext);

  return {
    totalElements: Number.isFinite(totalElements) ? totalElements : 0,
    totalPages: Number.isFinite(totalPages) ? totalPages : 0,
    currentPage: Number.isFinite(currentPage) ? currentPage : fallbackPage,
    hasNext,
    isLast: Boolean(payload?.last ?? !hasNext),
  };
}

const PAGE_SIZE = 15;

export default function OrdersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRows, setTotalRows] = useState(0);

  const buildParams = useCallback((targetPage) => {
    return { page: targetPage, size: PAGE_SIZE };
  }, []);

  const fetchOrdersPage = useCallback(
    async (targetPage, { replace = false } = {}) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError("");

      try {
        const data = await orderService.getOrders(buildParams(targetPage));
        const mapped = mapOrders(data);
        const meta = getPaginationMeta(data, targetPage);

        setRows((prev) => (replace ? mapped : [...prev, ...mapped]));
        setPage(meta.currentPage);
        setTotalRows(meta.totalElements);
        setHasMore(meta.hasNext || (!meta.isLast && mapped.length > 0));
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load orders.");
      } finally {
        if (replace) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [buildParams],
  );

  useEffect(() => {
    setRows([]);
    setPage(1);
    setHasMore(true);
    setTotalRows(0);
    fetchOrdersPage(1, { replace: true });
  }, [fetchOrdersPage]);

  useEffect(() => {
    function handleScroll() {
      if (loading || loadingMore || !hasMore || error) {
        return;
      }

      const scrolled = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 240;
      if (scrolled >= threshold) {
        fetchOrdersPage(page + 1);
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loading, loadingMore, hasMore, error, page, fetchOrdersPage]);

  const headerText = useMemo(
    () => `Orders (${totalRows || rows.length})`,
    [rows.length, totalRows],
  );

  return (
    <Stack spacing={2}>
      <PageHeader
        title={headerText}
        subtitle="Browse orders and manage payment or status updates."
        action={
          <Button
            component={RouterLink}
            to="/orders/new"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            New Order
          </Button>
        }
      />

      <Card>
        <CardContent>
          {error ? <Alert severity="error">{error}</Alert> : null}

          {loading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={26} />
            </Stack>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Order No.</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Order Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => navigate(`/orders/${row.id}`)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{row.orderNumber}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell align="right">{row.amount}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.paymentStatus}
                          color={getPaymentStatusColor(row.paymentStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.orderStatus}
                          color={getOrderStatusColor(row.orderStatus)}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && loadingMore ? (
            <Stack alignItems="center" py={1.5}>
              <CircularProgress size={22} />
            </Stack>
          ) : null}

          {!loading && !hasMore && rows.length > 0 ? (
            <Box pt={1.5}>
              <Alert severity="info">All matching orders are loaded.</Alert>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  );
}
