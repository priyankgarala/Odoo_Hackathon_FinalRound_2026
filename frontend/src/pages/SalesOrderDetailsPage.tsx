import { useNavigate, useParams } from "react-router-dom";
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
import * as salesOrdersApi from "../api/sales-orders.api";
import { generateInvoice } from "../api/invoices.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";

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

export const SalesOrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const order = useQuery({
    queryKey: ["sales-order", id],
    queryFn: () => salesOrdersApi.getSalesOrder(Number(id)),
    enabled: Boolean(id)
  });

  const transition = useMutation({
    mutationFn: (status: "CONFIRMED" | "CANCELLED") =>
      salesOrdersApi.setSalesOrderStatus({ id: Number(id), status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    }
  });

  const createInvoice = useMutation({
    mutationFn: () => generateInvoice(Number(id)),
    onSuccess: (invoice) => navigate(`/invoices/${invoice.id}`)
  });

  if (order.isLoading) return <LoadingState label="Loading sales order..." />;
  if (order.isError || !order.data)
    return <ErrorState message="Sales order could not be loaded." onRetry={() => void order.refetch()} />;

  const salesOrder = order.data;
  const canManage = salesOrder.status === "DRAFT";
  const canInvoice = salesOrder.status === "CONFIRMED";

  return (
    <DarkContainer title="Sales Order">
      <Stack spacing={4}>
        {/* Header Actions */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <CustomButton onClick={() => navigate("/sales-orders/new")}>New</CustomButton>
            {canManage && (
              <CustomButton
                disabled={transition.isPending}
                onClick={() => transition.mutate("CONFIRMED")}
              >
                {transition.isPending ? "..." : "Confirm"}
              </CustomButton>
            )}
            {canInvoice && (
              <CustomButton
                active
                disabled={createInvoice.isPending}
                onClick={() => createInvoice.mutate()}
              >
                {createInvoice.isPending ? "Creating..." : "Create Invoice"}
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
            <CustomButton onClick={() => navigate("/sales-orders")}>Back</CustomButton>
          </Stack>
        </Stack>

        {transition.isError && <Alert severity="error">The sales order status could not be updated.</Alert>}
        {createInvoice.isError && <Alert severity="error">Customer invoice already exists or could not be generated.</Alert>}

        {/* Header Fields */}
        <Stack spacing={2} maxWidth={650}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="white" minWidth={140}>SO No.</Typography>
            <Typography color="#90caf9" fontWeight={700} variant="h6">{salesOrder.orderNumber}</Typography>
            <Chip
              size="small"
              label={salesOrder.status}
              sx={{
                bgcolor: salesOrder.status === "CONFIRMED" ? "rgba(46, 125, 50, 0.2)" : "rgba(255, 255, 255, 0.12)",
                color: salesOrder.status === "CONFIRMED" ? "#81c784" : "white"
              }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="white" minWidth={140}>Customer Name</Typography>
            <Typography color="white" fontWeight={600}>{salesOrder.customer.name}</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="white" minWidth={140}>SO Date</Typography>
            <Typography color="white">
              {new Date(salesOrder.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Typography>
          </Stack>
        </Stack>

        {/* Items Table */}
        <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                <TableCell sx={{ color: "white", width: 60 }}>Sr. No.</TableCell>
                <TableCell sx={{ color: "white" }}>Product</TableCell>
                <TableCell sx={{ color: "white" }}>Budget Analytics</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 90 }}>Qty</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 130 }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 130 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesOrder.items?.map((item, idx) => (
                <TableRow key={item.id} sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{idx + 1}.</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>{item.productName}</TableCell>
                  <TableCell sx={{ color: "#90caf9" }}>Project 1</TableCell>
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
            Total: {formatMoney(salesOrder.total)}
          </Typography>
        </Stack>
      </Stack>
    </DarkContainer>
  );
};
