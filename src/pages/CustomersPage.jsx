import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PageHeader from "../components/common/PageHeader";
import { customerService } from "../services/customerService";
import { getListData } from "../utils/api";

function mapCustomers(payload) {
  const list = getListData(payload);

  return list.map((item, index) => ({
    id: item.id || index,
    name: item.name || item.customerName || "-",
    phone: item.phone || item.mobile || "-",
    email: item.email || "-",
    store: item.storeName || item.store?.name || "-",
  }));
}

function getPaginationMeta(payload, fallbackPage) {
  const totalElements = Number(payload?.totalElements);
  const currentPage = Number(payload?.page);
  const hasNext = Boolean(payload?.hasNext);

  return {
    totalElements: Number.isFinite(totalElements) ? totalElements : 0,
    currentPage: Number.isFinite(currentPage) ? currentPage : fallbackPage,
    hasNext,
    isLast: Boolean(payload?.last ?? !hasNext),
  };
}

const PAGE_SIZE = 15;

export default function CustomersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRows, setTotalRows] = useState(0);

  const buildParams = useCallback((targetPage) => {
    return {
      page: targetPage,
      size: PAGE_SIZE,
    };
  }, []);

  const fetchCustomersPage = useCallback(
    async (targetPage, { replace = false } = {}) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError("");

      try {
        const data = await customerService.getCustomers(buildParams(targetPage));
        const mapped = mapCustomers(data);
        const meta = getPaginationMeta(data, targetPage);

        setRows((prev) => (replace ? mapped : [...prev, ...mapped]));
        setPage(meta.currentPage);
        setTotalRows(meta.totalElements);
        setHasMore(meta.hasNext || (!meta.isLast && mapped.length > 0));
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load customers.");
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
    fetchCustomersPage(1, { replace: true });
  }, [fetchCustomersPage]);

  useEffect(() => {
    function handleScroll() {
      if (loading || loadingMore || !hasMore || error) {
        return;
      }

      const scrolled = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 240;
      if (scrolled >= threshold) {
        fetchCustomersPage(page + 1);
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loading, loadingMore, hasMore, error, page, fetchCustomersPage]);

  const headerText = useMemo(
    () => `Customer Directory (${totalRows || rows.length})`,
    [rows.length, totalRows],
  );

  return (
    <Stack spacing={2}>
      <PageHeader
        title={headerText}
        subtitle="Browse, create, and open customer records."
        action={
          <Button
            component={RouterLink}
            to="/customers/new"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            New Customer
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
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Store</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => navigate(`/customers/${row.id}`)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.store}</TableCell>
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
              <Alert severity="info">All matching customers are loaded.</Alert>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  );
}
