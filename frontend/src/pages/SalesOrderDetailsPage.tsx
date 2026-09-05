import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as salesOrdersApi from "../api/sales-orders.api";
import { generateInvoice } from "../api/invoices.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { useAuth } from "../features/auth/AuthProvider";

const money = (value: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));

export const SalesOrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const order = useQuery({ queryKey: ["sales-order", id], queryFn: () => salesOrdersApi.getSalesOrder(Number(id)), enabled: Boolean(id) });
  const transition = useMutation({ mutationFn: (status: "CONFIRMED" | "CANCELLED") => salesOrdersApi.setSalesOrderStatus({ id: Number(id), status }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sales-order", id] }); queryClient.invalidateQueries({ queryKey: ["sales-orders"] }); } });
  const createInvoice = useMutation({ mutationFn: () => generateInvoice(Number(id)), onSuccess: (invoice) => navigate(`/invoices/${invoice.id}`) });

  if (order.isLoading) return <LoadingState label="Loading sales order..." />;
  if (order.isError || !order.data) return <ErrorState message="Sales order could not be loaded." onRetry={() => void order.refetch()} />;

  const salesOrder = order.data;
  const canManage = ["Admin", "Accountant", "Sales"].includes(user?.role ?? "") && salesOrder.status === "DRAFT";
  const canInvoice = ["Admin", "Accountant", "Sales"].includes(user?.role ?? "") && salesOrder.status === "CONFIRMED";
  return <Stack spacing={3}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
      <Box><Typography variant="h4" fontWeight={750}>{salesOrder.orderNumber}</Typography><Typography color="text.secondary">{salesOrder.customer.name}</Typography></Box>
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap><Chip label={salesOrder.status} color={salesOrder.status === "CONFIRMED" ? "success" : "default"} />{canManage && <><Button variant="contained" disabled={transition.isPending} onClick={() => transition.mutate("CONFIRMED")}>Confirm order</Button><Button color="warning" disabled={transition.isPending} onClick={() => transition.mutate("CANCELLED")}>Cancel</Button></>}{canInvoice && <Button variant="contained" disabled={createInvoice.isPending} onClick={() => createInvoice.mutate()}>{createInvoice.isPending ? "Generating invoice..." : "Generate customer invoice"}</Button>}<Button onClick={() => navigate("/sales-orders")}>Back</Button></Stack>
    </Stack>
    {transition.isError && <Alert severity="error">The sales order status could not be updated.</Alert>}
    {createInvoice.isError && <Alert severity="error">The invoice could not be generated. This sales order may already be invoiced.</Alert>}
    {canInvoice && <Alert severity="info">Next step: generate the customer invoice, then record customer payment and view its journal entry.</Alert>}
    <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Unit price</TableCell><TableCell align="right">Tax</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead><TableBody>
      {salesOrder.items?.map((item) => <TableRow key={item.id}><TableCell>{item.productSku} · {item.productName}</TableCell><TableCell align="right">{item.quantity}</TableCell><TableCell align="right">{money(item.unitPrice)}</TableCell><TableCell align="right">{item.taxRate}%</TableCell><TableCell align="right">{money(item.lineTotal)}</TableCell></TableRow>)}
      <TableRow><TableCell colSpan={4} align="right"><Typography fontWeight={800}>Total</Typography></TableCell><TableCell align="right"><Typography fontWeight={800}>{money(salesOrder.total)}</Typography></TableCell></TableRow>
    </TableBody></Table></TableContainer>
  </Stack>;
};
