import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Chip, FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import * as invoicesApi from "../api/invoices.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";

const money = (value: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));

export const InvoicesPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const invoices = useQuery({ queryKey: ["invoices", search, status, page], queryFn: () => invoicesApi.getInvoices({ search: search || undefined, status: status || undefined, page, pageSize: 20 }) });
  return <Stack spacing={3}>
    <Box><Typography variant="h4" fontWeight={750}>Customer Invoices</Typography><Typography color="text.secondary">Sales order → invoice → customer payment → journal entry.</Typography></Box>
    <Paper sx={{ p: 2 }}><Stack direction={{ xs: "column", sm: "row" }} gap={2}><TextField label="Search invoice or customer" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} fullWidth /><FormControl sx={{ minWidth: 160 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><MenuItem value="">All statuses</MenuItem><MenuItem value="POSTED">Posted</MenuItem><MenuItem value="PAID">Paid</MenuItem></Select></FormControl></Stack></Paper>
    {invoices.isLoading ? <LoadingState label="Loading invoices..." /> : invoices.isError ? <ErrorState message="Could not load invoices." onRetry={() => void invoices.refetch()} /> : invoices.data!.data.length === 0 ? <EmptyState message="No invoices yet. Generate one from a confirmed sales order." /> : <><TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Customer</TableCell><TableCell>Sales order</TableCell><TableCell align="right">Total</TableCell><TableCell align="right">Outstanding</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{invoices.data!.data.map((invoice) => <TableRow component={RouterLink} to={`/invoices/${invoice.id}`} key={invoice.id} hover sx={{ textDecoration: "none" }}><TableCell><Typography color="primary" fontWeight={700}>{invoice.invoiceNumber}</Typography></TableCell><TableCell>{invoice.customer.name}</TableCell><TableCell>{invoice.salesOrder.orderNumber}</TableCell><TableCell align="right">{money(invoice.total)}</TableCell><TableCell align="right">{money(invoice.outstanding)}</TableCell><TableCell><Chip size="small" label={invoice.status} color={invoice.status === "PAID" ? "success" : "warning"} /></TableCell></TableRow>)}</TableBody></Table></TableContainer><Pagination page={page} count={Math.max(1, invoices.data!.meta.totalPages)} onChange={(_, value) => setPage(value)} /></>}
  </Stack>;
};
