import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/sales-orders.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";

const money = (x: string | number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(x) || 0);

const DarkContainer = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pt: 4, pb: 6 }}>
    {title && (
      <Box sx={{ bgcolor: "#3c3800", border: "1px solid #7a7300", borderRadius: 2, py: 1, px: 3, mb: 3, display: "inline-block" }}>
        <Typography variant="h6" color="#90EE90" fontWeight={600}>
          {title}
        </Typography>
      </Box>
    )}
    <Box sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, p: 3, bgcolor: "#121212" }}>
      {children}
    </Box>
  </Box>
);

export const SalesOrdersPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const orders = useQuery({
    queryKey: ["sales-orders", search, status, page],
    queryFn: () => api.getSalesOrders({ search: search || undefined, status: status || undefined, page, pageSize: 20 })
  });

  return (
    <DarkContainer title="Sales Orders">
      <Stack spacing={3}>
        {/* Header Actions */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" color="rgba(255,255,255,0.7)">
            Manage customer sales orders and create invoices
          </Typography>
          <Button
            variant="contained"
            component={RouterLink}
            to="/sales-orders/new"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: "#2B5E74",
              color: "white",
              borderRadius: 2,
              px: 3,
              py: 0.8,
              boxShadow: "none",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#1f4759" }
            }}
          >
            New Sales Order
          </Button>
        </Stack>

        {/* Search & Filter */}
        <Box sx={{ bgcolor: "#161616", p: 2, borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search order number or customer name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { color: "white" }
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Status</InputLabel>
              <Select
                label="Status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                sx={{ color: "white" }}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Table Content */}
        {orders.isLoading ? (
          <LoadingState label="Loading sales orders..." />
        ) : orders.isError ? (
          <ErrorState message="Could not load sales orders." onRetry={() => void orders.refetch()} />
        ) : orders.data!.data.length === 0 ? (
          <EmptyState message="No sales orders found. Click + New Sales Order to create one." />
        ) : (
          <>
            <TableContainer sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)", bgcolor: "#121212" }}>
              <Table>
                <TableHead sx={{ bgcolor: "#181818" }}>
                  <TableRow>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Order #</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Items</TableCell>
                    <TableCell align="right" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Total</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.data!.data.map((o) => (
                    <TableRow
                      component={RouterLink}
                      to={`/sales-orders/${o.id}`}
                      key={o.id}
                      hover
                      sx={{
                        textDecoration: "none",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.04)" }
                      }}
                    >
                      <TableCell>
                        <Typography color="#90EE90" fontWeight={600}>
                          {o.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }}>
                        {new Date(o.orderDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }}>
                        {o.customer.name}
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }}>
                        {o._count?.items ?? (o.items ? o.items.length : 1)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#ffffff", fontWeight: 600 }}>
                        {money(o.total)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={o.status}
                          sx={{
                            bgcolor:
                              o.status === "CONFIRMED"
                                ? "rgba(46, 125, 50, 0.2)"
                                : o.status === "DRAFT"
                                ? "rgba(237, 108, 2, 0.2)"
                                : "rgba(255,255,255,0.1)",
                            color:
                              o.status === "CONFIRMED"
                                ? "#90EE90"
                                : o.status === "DRAFT"
                                ? "#ffb74d"
                                : "rgba(255,255,255,0.7)",
                            border: "1px solid rgba(255,255,255,0.1)"
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                page={page}
                count={Math.max(1, orders.data!.meta.totalPages)}
                onChange={(_, v) => setPage(v)}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "white",
                    borderColor: "rgba(255,255,255,0.2)"
                  },
                  "& .Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.15) !important"
                  }
                }}
              />
            </Box>
          </>
        )}
      </Stack>
    </DarkContainer>
  );
};
