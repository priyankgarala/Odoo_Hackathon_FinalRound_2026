import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as purchaseOrdersApi from "../api/purchase-orders.api";
import { generateBill } from "../api/vendor-bills.api";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";

const money = (value: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));

export const PurchaseOrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const purchaseOrder = useQuery({ queryKey: ["purchase-order", id], queryFn: () => purchaseOrdersApi.getPurchaseOrder(Number(id)), enabled: Boolean(id) });
  const transition = useMutation({
    mutationFn: (status: "CONFIRMED" | "CANCELLED") => purchaseOrdersApi.setPurchaseOrderStatus({ id: Number(id), status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["purchase-order", id] }); queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }); },
  });
  const createBill = useMutation({ mutationFn: () => generateBill(Number(id)), onSuccess: (bill) => navigate(`/vendor-bills/${bill.id}`) });

  if (purchaseOrder.isLoading) return <LoadingState label="Loading purchase order..." />;
  if (purchaseOrder.isError || !purchaseOrder.data) return <ErrorState message="Purchase order could not be loaded." onRetry={() => void purchaseOrder.refetch()} />;

  const order = purchaseOrder.data;
  const hasPurchaseAccess = ["Admin", "Accountant", "Purchase"].includes(user?.role ?? "");
  const canManage = hasPurchaseAccess && order.status === "DRAFT";
  const canCreateBill = hasPurchaseAccess && order.status === "CONFIRMED";

  return <Stack spacing={3}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
      <Box><Typography variant="h4" fontWeight={750}>{order.orderNumber}</Typography><Typography color="text.secondary">{order.vendor.name} · {new Date(order.orderDate).toLocaleDateString()}</Typography></Box>
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        <Chip label={order.status} color={order.status === "CONFIRMED" ? "success" : order.status === "DRAFT" ? "warning" : "default"} />
        {canManage && <><Button variant="contained" disabled={transition.isPending} onClick={() => transition.mutate("CONFIRMED")}>Confirm</Button><Button color="warning" disabled={transition.isPending} onClick={() => transition.mutate("CANCELLED")}>Cancel order</Button></>}
        {canCreateBill && <Button variant="contained" disabled={createBill.isPending} onClick={() => createBill.mutate()}>{createBill.isPending ? "Generating bill..." : "Generate vendor bill"}</Button>}
        <Button onClick={() => navigate("/purchase-orders")}>Back</Button>
      </Stack>
    </Stack>
    {transition.isError && <Alert severity="error">Could not update purchase order status.</Alert>}
    {createBill.isError && <Alert severity="error">The vendor bill could not be generated. This purchase order may already have a bill.</Alert>}
    {canCreateBill && <Alert severity="info">Next step: generate the vendor bill, then record a partial or full payment on the bill screen.</Alert>}
    <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Quantity</TableCell><TableCell align="right">Unit price</TableCell><TableCell align="right">Tax</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead><TableBody>
      {order.items!.map((item) => <TableRow key={item.id}><TableCell><Typography fontWeight={700}>{item.productSku}</Typography>{item.productName}</TableCell><TableCell align="right">{item.quantity}</TableCell><TableCell align="right">{money(item.unitPrice)}</TableCell><TableCell align="right">{item.taxRate}% · {money(item.taxAmount)}</TableCell><TableCell align="right">{money(item.lineTotal)}</TableCell></TableRow>)}
      <TableRow><TableCell colSpan={4} align="right">Subtotal</TableCell><TableCell align="right">{money(order.subtotal)}</TableCell></TableRow><TableRow><TableCell colSpan={4} align="right">Tax</TableCell><TableCell align="right">{money(order.taxTotal)}</TableCell></TableRow><TableRow sx={{ bgcolor: "action.hover" }}><TableCell colSpan={4} align="right"><Typography fontWeight={800}>Total</Typography></TableCell><TableCell align="right"><Typography fontWeight={800}>{money(order.total)}</Typography></TableCell></TableRow>
    </TableBody></Table></TableContainer>
    <Alert severity="info">Unit prices, product SKU, and product name are captured on order lines to preserve purchase history.</Alert>
  </Stack>;
};
