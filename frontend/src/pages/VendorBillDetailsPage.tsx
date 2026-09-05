import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/vendor-bills.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { PurchaseAccountingFlow } from "../components/accounting/PurchaseAccountingFlow";

const money = (value: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));
export const VendorBillDetailsPage = () => {
  const { id } = useParams(); const navigate = useNavigate(); const queryClient = useQueryClient();
  const [paymentOpen, setPaymentOpen] = useState(false); const [success, setSuccess] = useState(""); const [amount, setAmount] = useState(""); const [method, setMethod] = useState("Bank Transfer"); const [reference, setReference] = useState("");
  const bill = useQuery({ queryKey: ["vendor-bill", id], queryFn: () => api.getBill(Number(id)), enabled: Boolean(id) });
  const payment = useMutation({ mutationFn: () => api.payBill({ id: Number(id), amount: Number(amount), paymentMethod: method, reference }), onSuccess: () => { setSuccess(`Payment of ${money(amount)} completed and posted to the Bank Journal.`); setPaymentOpen(false); queryClient.invalidateQueries({ queryKey: ["vendor-bill", id] }); queryClient.invalidateQueries({ queryKey: ["vendor-bills"] }); } });
  if (bill.isLoading) return <LoadingState label="Loading vendor bill..." />;
  if (bill.isError || !bill.data) return <ErrorState message="Vendor bill could not be loaded." onRetry={() => void bill.refetch()} />;
  const current = bill.data;
  return <Stack spacing={3}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}><Box><Typography variant="h4" fontWeight={750}>{current.billNumber}</Typography><Typography color="text.secondary">{current.vendor.name} · PO {current.purchaseOrder.orderNumber}</Typography></Box><Stack direction="row" gap={1}><Chip label={current.status} color={current.status === "PAID" ? "success" : "warning"} />{current.status === "POSTED" && <Button variant="contained" onClick={() => { setAmount(current.outstanding); setPaymentOpen(true); }}>Record completed payment</Button>}<Button onClick={() => navigate("/vendor-bills")}>Back</Button></Stack></Stack>
    <Paper sx={{ p: 2 }}><Typography>Total: {money(current.total)} · Paid: {money(current.paidAmount)} · Outstanding: <b>{money(current.outstanding)}</b></Typography><Typography>Bill journal: {current.journalEntry ? <Button component={RouterLink} to={`/journal-entries/${current.journalEntry.id}`} size="small">{current.journalEntry.entryNumber}</Button> : "—"}</Typography></Paper>
    <PurchaseAccountingFlow />
    <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Unit price</TableCell><TableCell align="right">Tax</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead><TableBody>{current.items?.map((item) => <TableRow key={item.id}><TableCell>{item.productSku} · {item.productName}</TableCell><TableCell align="right">{item.quantity}</TableCell><TableCell align="right">{money(item.unitPrice)}</TableCell><TableCell align="right">{item.taxRate}%</TableCell><TableCell align="right">{money(item.lineTotal)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
    {success && <Alert severity="success">{success}</Alert>}
    <Paper sx={{ p: 2 }}><Typography variant="h6">Completed payment history</Typography>{current.payments?.length ? <Table><TableBody>{current.payments.map((entry) => <TableRow key={entry.id}><TableCell>{entry.paymentNumber}</TableCell><TableCell>{entry.paymentMethod}</TableCell><TableCell>{entry.reference ?? "—"}</TableCell><TableCell align="right">{money(entry.amount)}</TableCell><TableCell><Button component={RouterLink} to={`/journal-entries/${entry.journalEntry.id}`} size="small">{entry.journalEntry.entryNumber}</Button></TableCell></TableRow>)}</TableBody></Table> : <Typography color="text.secondary">No payments recorded.</Typography>}</Paper>
    <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)}><DialogTitle>Record completed vendor payment</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{payment.isError && <Alert severity="error">Payment failed. Ensure amount does not exceed outstanding.</Alert>}<TextField label="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /><TextField label="Payment method" value={method} onChange={(event) => setMethod(event.target.value)} /><TextField label="Reference" value={reference} onChange={(event) => setReference(event.target.value)} /></Stack></DialogContent><DialogActions><Button onClick={() => setPaymentOpen(false)}>Cancel</Button><Button variant="contained" disabled={!amount || Number(amount) <= 0 || Number(amount) > Number(current.outstanding) || payment.isPending} onClick={() => payment.mutate()}>Send money & post journal</Button></DialogActions></Dialog>
  </Stack>;
};
