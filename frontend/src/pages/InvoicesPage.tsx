import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
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
import { useQuery } from "@tanstack/react-query";
import * as invoicesApi from "../api/invoices.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";

const money = (value: string | number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value) || 0);

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

export const InvoicesPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const invoices = useQuery({
    queryKey: ["invoices", search, status, page],
    queryFn: () => invoicesApi.getInvoices({ search: search || undefined, status: status || undefined, page, pageSize: 20 })
  });

  return (
    <DarkContainer title="Customer Invoices & Receipts">
      <Stack spacing={3}>
        <Typography variant="body1" color="rgba(255,255,255,0.7)">
          Sales order → Customer invoice → Receive payment → Automated journal entry
        </Typography>

        {/* Search & Filter */}
        <Box sx={{ bgcolor: "#161616", p: 2, borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search invoice number or customer name..."
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
                <MenuItem value="POSTED">Outstanding</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Table Content */}
        {invoices.isLoading ? (
          <LoadingState label="Loading invoices..." />
        ) : invoices.isError ? (
          <ErrorState message="Could not load invoices." onRetry={() => void invoices.refetch()} />
        ) : invoices.data!.data.length === 0 ? (
          <EmptyState message="No invoices yet. Generate one from a confirmed sales order." />
        ) : (
          <>
            <TableContainer sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)", bgcolor: "#121212" }}>
              <Table>
                <TableHead sx={{ bgcolor: "#181818" }}>
                  <TableRow>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Invoice #</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Sales Order</TableCell>
                    <TableCell align="right" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Total</TableCell>
                    <TableCell align="right" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Outstanding</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.data!.data.map((inv) => (
                    <TableRow
                      component={RouterLink}
                      to={`/invoices/${inv.id}`}
                      key={inv.id}
                      hover
                      sx={{
                        textDecoration: "none",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.04)" }
                      }}
                    >
                      <TableCell>
                        <Typography color="#90EE90" fontWeight={600}>
                          {inv.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }}>
                        {inv.customer.name}
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }}>
                        {inv.salesOrder.orderNumber}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#ffffff", fontWeight: 600 }}>
                        {money(inv.total)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: Number(inv.outstanding) > 0 ? "#ff8a80" : "#90EE90",
                          fontWeight: 600
                        }}
                      >
                        {money(inv.outstanding)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={inv.status}
                          sx={{
                            bgcolor:
                              inv.status === "PAID"
                                ? "rgba(46, 125, 50, 0.2)"
                                : "rgba(237, 108, 2, 0.2)",
                            color: inv.status === "PAID" ? "#90EE90" : "#ffb74d",
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
                count={Math.max(1, invoices.data!.meta.totalPages)}
                onChange={(_, value) => setPage(value)}
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
