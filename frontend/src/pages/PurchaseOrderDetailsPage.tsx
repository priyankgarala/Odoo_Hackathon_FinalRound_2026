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
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as purchaseOrdersApi from "../api/purchase-orders.api";
import { generateBill } from "../api/vendor-bills.api";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";

const COLORS = {
  page: "#f8fafc",
  card: "#ffffff",
  cardHover: "#f1f5f9",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  muted: "#64748b",

  accent: "#2563eb",
  accentHover: "#1d4ed8",
  accentSoft: "#eff6ff",

  success: "#16a34a",
  successSoft: "#dcfce7",

  danger: "#dc2626",
  dangerSoft: "#fee2e2",

  warning: "#d97706",
  warningSoft: "#fef3c7",
};

const formatMoney = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const DarkContainer = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) => (
  <Box
    sx={{
      width: "100%",
      maxWidth: 1100,
      mx: "auto",
      pt: 4,
      pb: 4,
    }}
  >
    {title && (
      <Box
        sx={{
          bgcolor: COLORS.card,
          border: `1px solid ${COLORS.borderStrong}`,
          borderRadius: 2,
          py: 1.25,
          px: 3,
          mb: 3,
          display: "inline-block",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: COLORS.text,
            fontWeight: 700,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Typography>
      </Box>
    )}

    <Box
      sx={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        p: { xs: 2, md: 3.5 },
        bgcolor: COLORS.card,
      }}
    >
      {children}
    </Box>
  </Box>
);

const CustomButton = ({ children, active, ...props }: any) => (
  <Button
    variant="outlined"
    sx={{
      color: active ? COLORS.page : COLORS.text,
      bgcolor: active ? COLORS.accent : "transparent",
      borderColor: active ? COLORS.accent : COLORS.borderStrong,
      borderRadius: 2,
      textTransform: "none",
      minWidth: 80,
      fontWeight: 600,

      "&:hover": {
        bgcolor: active ? COLORS.accentHover : COLORS.accentSoft,
        borderColor: COLORS.accent,
      },

      "&.Mui-disabled": {
        color: COLORS.muted,
        borderColor: COLORS.border,
      },
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

  const purchaseOrder = useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseOrdersApi.getPurchaseOrder(Number(id)),
    enabled: Boolean(id),
  });

  const transition = useMutation({
    mutationFn: (status: "CONFIRMED" | "CANCELLED") =>
      purchaseOrdersApi.setPurchaseOrderStatus({
        id: Number(id),
        status,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["purchase-order", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["purchase-orders"],
      });
    },
  });

  const createBill = useMutation({
    mutationFn: () => generateBill(Number(id)),
    onSuccess: (bill) => navigate(`/vendor-bills/${bill.id}`),
  });

  if (purchaseOrder.isLoading) {
    return <LoadingState label="Loading purchase order..." />;
  }

  if (purchaseOrder.isError || !purchaseOrder.data) {
    return (
      <ErrorState
        message="Purchase order could not be loaded."
        onRetry={() => void purchaseOrder.refetch()}
      />
    );
  }

  const order = purchaseOrder.data;

  const canManage = order.status === "DRAFT";
  const canCreateBill = order.status === "CONFIRMED";

  const statusColor =
    order.status === "CONFIRMED"
      ? COLORS.success
      : order.status === "CANCELLED"
      ? COLORS.danger
      : COLORS.warning;

  const statusBackground =
    order.status === "CONFIRMED"
      ? COLORS.successSoft
      : order.status === "CANCELLED"
      ? COLORS.dangerSoft
      : COLORS.warningSoft;

  return (
    <DarkContainer title="Purchase Order">
      <Stack spacing={4}>

        {/* Header Actions */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
        >
          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
          >
            {canManage && (
              <CustomButton
                disabled={transition.isPending}
                onClick={() => transition.mutate("CONFIRMED")}
              >
                {transition.isPending ? "Confirming..." : "Confirm"}
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

          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
          >
            {canManage && (
              <CustomButton
                disabled={transition.isPending}
                onClick={() => transition.mutate("CANCELLED")}
                sx={{
                  color: COLORS.danger,
                  borderColor: COLORS.danger,

                  "&:hover": {
                    color: COLORS.danger,
                    borderColor: COLORS.danger,
                    bgcolor: COLORS.dangerSoft,
                  },
                }}
              >
                Cancel
              </CustomButton>
            )}

            <CustomButton
              onClick={() => navigate("/purchase-orders")}
            >
              Back
            </CustomButton>
          </Stack>
        </Stack>

        {/* Error Messages */}
        {transition.isError && (
          <Alert
            severity="error"
            sx={{
              bgcolor: COLORS.dangerSoft,
              color: COLORS.danger,
              border: `1px solid ${COLORS.danger}`,
              "& .MuiAlert-icon": {
                color: COLORS.danger,
              },
            }}
          >
            Could not update purchase order status.
          </Alert>
        )}

        {createBill.isError && (
          <Alert
            severity="error"
            sx={{
              bgcolor: COLORS.dangerSoft,
              color: COLORS.danger,
              border: `1px solid ${COLORS.danger}`,
              "& .MuiAlert-icon": {
                color: COLORS.danger,
              },
            }}
          >
            Vendor bill already exists or could not be generated.
          </Alert>
        )}

        {/* Purchase Order Information */}
        <Box
          sx={{
            bgcolor: COLORS.page,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: { xs: 2, md: 3 },
          }}
        >
          <Stack spacing={2.5} maxWidth={700}>

            {/* PO Number + Status */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Typography
                color={COLORS.muted}
                minWidth={{ sm: 140 }}
                fontSize={14}
              >
                PO No.
              </Typography>

              <Typography
                sx={{
                  color: COLORS.accent,
                  fontWeight: 700,
                  fontSize: "1.15rem",
                }}
              >
                {order.orderNumber}
              </Typography>

              <Chip
                size="small"
                label={order.status}
                sx={{
                  bgcolor: statusBackground,
                  color: statusColor,
                  border: `1px solid ${statusColor}`,
                  fontWeight: 700,
                }}
              />
            </Stack>

            {/* Vendor */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Typography
                color={COLORS.muted}
                minWidth={{ sm: 140 }}
                fontSize={14}
              >
                Vendor Name
              </Typography>

              <Typography
                color={COLORS.text}
                fontWeight={600}
              >
                {order.vendor.name}
              </Typography>
            </Stack>

            {/* PO Date */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Typography
                color={COLORS.muted}
                minWidth={{ sm: 140 }}
                fontSize={14}
              >
                PO Date
              </Typography>

              <Typography color={COLORS.text}>
                {new Date(order.orderDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Line Items */}
        <TableContainer
          sx={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            overflowX: "auto",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: COLORS.page,
                  "& th": {
                    borderBottom: `1px solid ${COLORS.borderStrong}`,
                  },
                }}
              >
                <TableCell
                  sx={{
                    color: COLORS.muted,
                    width: 70,
                    fontWeight: 600,
                  }}
                >
                  Sr. No.
                </TableCell>

                <TableCell
                  sx={{
                    color: COLORS.muted,
                    fontWeight: 600,
                  }}
                >
                  Product
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    color: COLORS.muted,
                    width: 100,
                    fontWeight: 600,
                  }}
                >
                  Qty
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    color: COLORS.muted,
                    width: 140,
                    fontWeight: 600,
                  }}
                >
                  Unit Price
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    color: COLORS.muted,
                    width: 140,
                    fontWeight: 600,
                  }}
                >
                  Total
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {order.items?.map((item, idx) => (
                <TableRow
                  key={item.id}
                  sx={{
                    bgcolor: COLORS.card,
                    "&:hover": {
                      bgcolor: COLORS.cardHover,
                    },
                    "& td": {
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 1.75,
                    },
                  }}
                >
                  <TableCell sx={{ color: COLORS.muted }}>
                    {idx + 1}.
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.text,
                      fontWeight: 600,
                    }}
                  >
                    {item.productName}
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ color: COLORS.text }}
                  >
                    {item.quantity}
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ color: COLORS.text }}
                  >
                    {formatMoney(item.unitPrice)}
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.text,
                      fontWeight: 700,
                    }}
                  >
                    {formatMoney(item.lineTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Total */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Box
            sx={{
              minWidth: { xs: "100%", sm: 300 },
              bgcolor: COLORS.page,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              px: 3,
              py: 2,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                color={COLORS.muted}
                fontSize={15}
              >
                Total
              </Typography>

              <Typography
                variant="h5"
                color={COLORS.text}
                fontWeight={700}
              >
                {formatMoney(order.total)}
              </Typography>
            </Stack>
          </Box>
        </Box>

      </Stack>
    </DarkContainer>
  );
};