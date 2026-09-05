import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as purchaseOrdersApi from "../api/purchase-orders.api";
import { generateBill } from "../api/vendor-bills.api";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";

const formatMoney = (value: string | number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);

const DarkContainer = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pt: 4 }}>
    {title && (
      <Box sx={{ bgcolor: "#3c3800", border: "1px solid #7a7300", borderRadius: 2, py: 1, px: 3, mb: 3, display: "inline-block" }}>
        <Typography variant="h6" color="#90EE90" fontWeight={600}>{title}</Typography>
      </Box>
    )}
    <Box sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, p: 3, bgcolor: "#121212" }}>
      {children}
    </Box>
  </Box>
);

const CustomButton = ({ children, active, ...props }: any) => (
  <Button
    variant="outlined"
    sx={{
      color: active ? "black" : "white",
      bgcolor: active ? "white" : "transparent",
      borderColor: "rgba(255,255,255,0.5)",
      borderRadius: 2,
      textTransform: "none",
      minWidth: 80,
      "&:hover": { bgcolor: active ? "white" : "rgba(255,255,255,0.1)", borderColor: "white" }
    }}
    {...props}
  >
    {children}
  </Button>
);

export const PurchaseOrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const purchaseOrder = useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseOrdersApi.getPurchaseOrder(Number(id)),
    enabled: Boolean(id)
  });

  const transition = useMutation({
    mutationFn: (status: "CONFIRMED" | "CANCELLED") =>
      purchaseOrdersApi.setPurchaseOrderStatus({ id: Number(id), status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    }
  });

  const createBill = useMutation({
    mutationFn: () => generateBill(Number(id)),
    onSuccess: (bill) => navigate(`/vendor-bills/${bill.id}`)
  });

  if (purchaseOrder.isLoading) return <LoadingState label="Loading purchase order..." />;
  if (purchaseOrder.isError || !purchaseOrder.data)
    return <ErrorState message="Purchase order could not be loaded." onRetry={() => void purchaseOrder.refetch()} />;

  const order = purchaseOrder.data;
  const canManage = order.status === "DRAFT";
  const canCreateBill = order.status === "CONFIRMED";

  return (
    <DarkContainer title="Purchase Order">
      <Stack spacing={4}>
        {/* Header Actions */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <CustomButton onClick={() => navigate("/purchase-orders/new")}>New</CustomButton>
            {canManage && (
              <CustomButton
                disabled={transition.isPending}
                onClick={() => transition.mutate("CONFIRMED")}
              >
                {transition.isPending ? "..." : "Confirm"}
              </CustomButton>
            )}
            {canCreateBill && (
              <CustomButton
                active
                disabled={createBill.isPending}
                onClick={() => createBill.mutate()}
              >
                {createBill.isPending ? "Creating..." : "Create Bill"}
              </CustomButton>
            )}
          </Stack>
          <Stack direction="row" spacing={2}>
            {canManage && (
              <CustomButton
                disabled={transition.isPending}
                onClick={() => transition.mutate("CANCELLED")}
              >
                Cancel
              </CustomButton>
            )}
            <CustomButton onClick={() => navigate("/purchase-orders")}>Back</CustomButton>
          </Stack>
        </Stack>

        {transition.isError && <Alert severity="error">Could not update purchase order status.</Alert>}
        {createBill.isError && <Alert severity="error">Vendor bill already exists or could not be generated.</Alert>}

        {/* Header Fields */}
        <Stack spacing={2} maxWidth={650}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="white" minWidth={140}>PO No.</Typography>
            <Typography color="#90caf9" fontWeight={700} variant="h6">{order.orderNumber}</Typography>
            <Chip
              size="small"
              label={order.status}
              sx={{
                bgcolor: order.status === "CONFIRMED" ? "rgba(46, 125, 50, 0.2)" : "rgba(255, 255, 255, 0.12)",
                color: order.status === "CONFIRMED" ? "#81c784" : "white"
              }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="white" minWidth={140}>Vendor Name</Typography>
            <Typography color="white" fontWeight={600}>{order.vendor.name}</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="white" minWidth={140}>PO Date</Typography>
            <Typography color="white">
              {new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Typography>
          </Stack>
        </Stack>

        {/* Line Items Table */}
        <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                <TableCell sx={{ color: "white", width: 60 }}>Sr. No.</TableCell>
                <TableCell sx={{ color: "white" }}>Product</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 100 }}>Qty</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 140 }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 140 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items?.map((item, idx) => (
                <TableRow key={item.id} sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{idx + 1}.</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    {item.productName}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "white" }}>{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ color: "white" }}>{formatMoney(item.unitPrice)}</TableCell>
                  <TableCell align="right" sx={{ color: "white", fontWeight: 600 }}>{formatMoney(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" justifyContent="flex-end">
          <Typography variant="h5" color="white" fontWeight={700}>
            Total: {formatMoney(order.total)}
          </Typography>
        </Stack>
      </Stack>
    </DarkContainer>
  );
};
