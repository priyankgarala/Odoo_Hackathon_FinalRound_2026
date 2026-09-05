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
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/vendor-bills.api";
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

export const VendorBillsPage = () => {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const bills = useQuery({
    queryKey: ["vendor-bills", status, page],
    queryFn: () => api.getBills({ status: status || undefined, page, pageSize: 20 })
  });

  return (
    <DarkContainer title="Vendor Bills & Payments">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" color="rgba(255,255,255,0.7)">
            Manage supplier invoices, record bank/cash payments, and track outstanding payables
          </Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Filter Status</InputLabel>
            <Select
              label="Filter Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              sx={{ color: "white" }}
            >
              <MenuItem value="">All bills</MenuItem>
              <MenuItem value="POSTED">Outstanding</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {bills.isLoading ? (
          <LoadingState label="Loading vendor bills..." />
        ) : bills.isError ? (
          <ErrorState message="Could not load vendor bills." onRetry={() => void bills.refetch()} />
        ) : bills.data!.data.length === 0 ? (
          <EmptyState message="No vendor bills found. Confirm a purchase order, then generate its bill." />
        ) : (
          <>
            <TableContainer sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)", bgcolor: "#121212" }}>
              <Table>
                <TableHead sx={{ bgcolor: "#181818" }}>
                  <TableRow>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Bill #</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Vendor</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Purchase Order</TableCell>
                    <TableCell align="right" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Total</TableCell>
                    <TableCell align="right" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Outstanding</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bills.data!.data.map((b) => (
                    <TableRow
                      component={RouterLink}
                      to={`/vendor-bills/${b.id}`}
                      key={b.id}
                      hover
                      sx={{
                        textDecoration: "none",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.04)" }
                      }}
                    >
                      <TableCell>
                        <Typography color="#90EE90" fontWeight={600}>
                          {b.billNumber}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }}>
                        {b.vendor.name}
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }}>
                        {b.purchaseOrder.orderNumber}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#ffffff", fontWeight: 600 }}>
                        {money(b.total)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: Number(b.outstanding) > 0 ? "#ff8a80" : "#90EE90",
                          fontWeight: 600
                        }}
                      >
                        {money(b.outstanding)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={b.status}
                          sx={{
                            bgcolor:
                              b.status === "PAID"
                                ? "rgba(46, 125, 50, 0.2)"
                                : "rgba(237, 108, 2, 0.2)",
                            color: b.status === "PAID" ? "#90EE90" : "#ffb74d",
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
                count={Math.max(1, bills.data!.meta.totalPages)}
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
