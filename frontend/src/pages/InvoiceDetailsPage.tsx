import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as invoicesApi from "../api/invoices.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";

const money = (value: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));

export const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [success, setSuccess] = useState("");
  const invoice = useQuery({ queryKey: ["invoice", id], queryFn: () => invoicesApi.getInvoice(Number(id)), enabled: Boolean(id) });
  const payment = useMutation({
    mutationFn: () => invoicesApi.payInvoice({ id: Number(id), amount: Number(amount), paymentMethod, reference }),
    onSuccess: () => { setSuccess(`Customer payment of ${money(amount)} was recorded and posted to the Bank Journal.`); setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ["invoice", id] }); queryClient.invalidateQueries({ queryKey: ["invoices"] }); },
  });
  if (invoice.isLoading) return <LoadingState label="Loading invoice..." />;
  if (invoice.isError || !invoice.data) return <ErrorState message="Invoice could not be loaded." onRetry={() => void invoice.refetch()} />;
  const current = invoice.data;
  const openPayment = () => { setAmount(current.outstanding); setDialogOpen(true); };

  return <Stack spacing={3}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}><Box><Typography variant="h4" fontWeight={750}>{current.invoiceNumber}</Typography><Typography color="text.secondary">{current.customer.name} · Sales Order {current.salesOrder.orderNumber}</Typography><Typography variant="body2" color="text.secondary">Due {new Date(current.dueDate).toLocaleDateString("en-IN")}</Typography></Box><Stack direction="row" gap={1} flexWrap="wrap" useFlexGap><Chip label={current.status} color={current.status === "PAID" ? "success" : "warning"} />{current.status === "POSTED" && <Button variant="contained" onClick={openPayment}>Record customer payment</Button>}<Button onClick={() => navigate("/invoices")}>Back</Button></Stack></Stack>
    <Paper sx={{ p: 2 }}><Typography>Total: {money(current.total)} · Paid: {money(current.paidAmount)} · Outstanding: <b>{money(current.outstanding)}</b></Typography><Typography>Invoice journal: {current.journalEntry ? <Button component={RouterLink} to={`/journal-entries/${current.journalEntry.id}`} size="small">{current.journalEntry.entryNumber}</Button> : "—"}</Typography></Paper>
    <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Unit price</TableCell><TableCell align="right">Tax</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead><TableBody>{current.items?.map((item) => <TableRow key={item.id}><TableCell>{item.productSku} · {item.productName}</TableCell><TableCell align="right">{item.quantity}</TableCell><TableCell align="right">{money(item.unitPrice)}</TableCell><TableCell align="right">{item.taxRate}% · {money(item.taxAmount)}</TableCell><TableCell align="right">{money(item.lineTotal)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
    {success && <Alert severity="success">{success}</Alert>}
    <Paper sx={{ p: 2 }}><Typography variant="h6">Customer payment history</Typography>{current.payments?.length ? <Table><TableBody>{current.payments.map((entry) => <TableRow key={entry.id}><TableCell>{entry.paymentNumber}</TableCell><TableCell>{new Date(entry.paymentDate).toLocaleDateString("en-IN")}</TableCell><TableCell>{entry.paymentMethod}</TableCell><TableCell>{entry.reference ?? "—"}</TableCell><TableCell align="right">{money(entry.amount)}</TableCell><TableCell><Button component={RouterLink} to={`/journal-entries/${entry.journalEntry.id}`} size="small">{entry.journalEntry.entryNumber}</Button></TableCell></TableRow>)}</TableBody></Table> : <Typography color="text.secondary">No customer payments recorded.</Typography>}</Paper>
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs"><DialogTitle>Record customer payment</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{payment.isError && <Alert severity="error">Payment failed. Ensure the amount does not exceed the outstanding balance.</Alert>}<TextField label="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} inputProps={{ min: 0.01, max: Number(current.outstanding) }} /><TextField label="Payment method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} /><TextField label="Payment reference" value={reference} onChange={(event) => setReference(event.target.value)} /></Stack></DialogContent><DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" disabled={!amount || Number(amount) <= 0 || Number(amount) > Number(current.outstanding) || payment.isPending} onClick={() => payment.mutate()}>Receive payment & post journal</Button></DialogActions></Dialog>
  </Stack>;
};
