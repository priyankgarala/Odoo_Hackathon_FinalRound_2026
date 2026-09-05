import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import PrintIcon from "@mui/icons-material/Print";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as invoicesApi from "../api/invoices.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";

const COLORS = {
  page: "#0B1220",
  card: "#111B2E",
  cardHover: "#16233A",
  border: "rgba(148, 163, 184, 0.16)",
  borderStrong: "rgba(148, 163, 184, 0.28)",
  text: "#F1F5F9",
  muted: "#94A3B8",

  accent: "#4DB6AC",
  accentHover: "#3F9E96",
  accentSoft: "rgba(77, 182, 172, 0.12)",

  success: "#6FCF97",
  successSoft: "rgba(111, 207, 151, 0.12)",

  danger: "#E98B8B",
  dangerSoft: "rgba(233, 139, 139, 0.10)",

  warning: "#D9B86C",
  warningSoft: "rgba(217, 184, 108, 0.10)",

  info: "#7FA9C9",
  infoSoft: "rgba(127, 169, 201, 0.10)",
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

const darkTextFieldSx = {
  "& .MuiInputBase-root": {
    color: COLORS.text,
  },

  "& .MuiInput-underline:before": {
    borderBottomColor: COLORS.borderStrong,
  },

  "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
    borderBottomColor: COLORS.accent,
  },

  "& .MuiInput-underline:after": {
    borderBottomColor: COLORS.accent,
  },

  "& .MuiInputLabel-root": {
    color: COLORS.muted,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: COLORS.accent,
  },

  "& .MuiSvgIcon-root": {
    color: COLORS.muted,
  },
};

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

export const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [payType, setPayType] = useState("RECEIVE");
  const [amount, setAmount] = useState("");
  const [paymentVia, setPaymentVia] = useState("Bank");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [memo, setMemo] = useState("");

  const invoice = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.getInvoice(Number(id)),
    enabled: Boolean(id),
  });

  const payment = useMutation({
    mutationFn: () =>
      invoicesApi.payInvoice({
        id: Number(id),
        amount: Number(amount),
        paymentMethod: paymentVia,
        reference: memo || undefined,
      }),

    onSuccess: () => {
      setSuccess(
        `Customer payment of ${formatMoney(
          amount
        )} completed and posted to ${paymentVia} Journal.`
      );

      setPaymentOpen(false);

      queryClient.invalidateQueries({
        queryKey: ["invoice", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["invoices"],
      });
    },
  });

  if (invoice.isLoading) {
    return <LoadingState label="Loading customer invoice..." />;
  }

  if (invoice.isError || !invoice.data) {
    return (
      <ErrorState
        message="Invoice could not be loaded."
        onRetry={() => void invoice.refetch()}
      />
    );
  }

  const current = invoice.data;

  const totalNum = Number(current.total) || 0;
  const outstandingNum = Number(current.outstanding) || 0;
  const paidNum = Number(current.paidAmount) || 0;

  const statusLabel =
    outstandingNum === 0
      ? "Paid"
      : paidNum > 0
      ? "Part Paid"
      : "Not Paid";

  const statusColor =
    statusLabel === "Paid"
      ? COLORS.success
      : statusLabel === "Part Paid"
      ? COLORS.warning
      : COLORS.danger;

  const openPaymentModal = () => {
    setAmount(String(current.outstanding));
    setPaymentVia("Bank");
    setPayDate(new Date().toISOString().slice(0, 10));
    setMemo(`Invoice receipt for ${current.invoiceNumber}`);
    setPaymentOpen(true);
  };

  return (
    <DarkContainer title="Customer Invoice">
      <Stack spacing={4}>

        {/* Header Toolbar */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
        >
          <Stack direction="row" spacing={2}>
            {outstandingNum > 0 && (
              <CustomButton active onClick={openPaymentModal}>
                Pay
              </CustomButton>
            )}
          </Stack>

          {/* Smart Buttons */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            {current.salesOrder && (
              <CustomButton
                component={RouterLink}
                to={`/sales-orders/${current.salesOrder.id}`}
                sx={{
                  borderColor: COLORS.info,
                  color: COLORS.info,
                }}
              >
                SO
              </CustomButton>
            )}

            <CustomButton
              component={RouterLink}
              to="/reports/budget"
              sx={{
                borderColor: COLORS.success,
                color: COLORS.success,
              }}
            >
              Budget
            </CustomButton>

            <CustomButton onClick={() => window.print()}>
              Print
            </CustomButton>

            <CustomButton onClick={() => navigate("/invoices")}>
              Back
            </CustomButton>
          </Stack>
        </Stack>

        {/* Success Message */}
        {success && (
          <Alert
            severity="success"
            sx={{
              bgcolor: COLORS.successSoft,
              color: COLORS.success,
              border: `1px solid ${COLORS.success}`,
              "& .MuiAlert-icon": {
                color: COLORS.success,
              },
            }}
          >
            {success}
          </Alert>
        )}

        {/* Invoice Header */}
        <Box
          sx={{
            bgcolor: COLORS.page,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            p: { xs: 2, md: 3 },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={{ xs: 3, md: 6 }}
          >
            <Stack spacing={2.5} flex={1}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
              >
                <Typography
                  color={COLORS.muted}
                  minWidth={{ sm: 160 }}
                  fontSize={14}
                >
                  Customer Invoice No.
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.accent,
                    fontWeight: 700,
                    fontSize: "1.15rem",
                  }}
                >
                  {current.invoiceNumber}
                </Typography>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
              >
                <Typography
                  color={COLORS.muted}
                  minWidth={{ sm: 160 }}
                  fontSize={14}
                >
                  Customer Name
                </Typography>

                <Typography color={COLORS.text} fontWeight={600}>
                  {current.customer.name}
                </Typography>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
              >
                <Typography
                  color={COLORS.muted}
                  minWidth={{ sm: 160 }}
                  fontSize={14}
                >
                  Status
                </Typography>

                <Chip
                  label={statusLabel}
                  sx={{
                    bgcolor:
                      statusLabel === "Paid"
                        ? COLORS.successSoft
                        : statusLabel === "Part Paid"
                        ? COLORS.warningSoft
                        : COLORS.dangerSoft,
                    color: statusColor,
                    fontWeight: 700,
                    border: `1px solid ${statusColor}`,
                    height: 30,
                  }}
                />
              </Stack>
            </Stack>

            <Stack spacing={2.5} flex={1}>
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
                  Invoice Reference
                </Typography>

                <Typography color={COLORS.text}>
                  {current.invoiceNumber}
                </Typography>
              </Stack>

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
                  Invoice Date
                </Typography>

                <Typography color={COLORS.text}>
                  {new Date(current.invoiceDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Typography>
              </Stack>

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
                  Due Date
                </Typography>

                <Typography color={COLORS.text}>
                  {new Date(current.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Items Table */}
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
                <TableCell sx={{ color: COLORS.muted, width: 50 }}>
                  Sr.
                </TableCell>

                <TableCell sx={{ color: COLORS.muted }}>
                  Product
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ color: COLORS.muted, width: 70 }}
                >
                  Qty
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ color: COLORS.muted, width: 120 }}
                >
                  Unit Price
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ color: COLORS.muted, width: 120 }}
                >
                  Subtotal
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ color: COLORS.muted, width: 110 }}
                >
                  Tax Amount
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ color: COLORS.muted, width: 130 }}
                >
                  Total
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {current.items?.map((item, idx) => (
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

                    {item.taxLines && item.taxLines.length > 0 && (
                      <Box
                        sx={{
                          mt: 0.75,
                          display: "flex",
                          gap: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        {item.taxLines.map((tl) => (
                          <Chip
                            key={tl.id}
                            label={`${tl.taxName}: ${formatMoney(
                              tl.taxAmount
                            )}`}
                            size="small"
                            sx={{
                              bgcolor: COLORS.infoSoft,
                              color: COLORS.info,
                              border: `1px solid ${COLORS.info}`,
                              fontSize: "0.7rem",
                              height: 22,
                            }}
                          />
                        ))}
                      </Box>
                    )}
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
                    sx={{ color: COLORS.text }}
                  >
                    {formatMoney(
                      item.lineSubtotal ||
                        Number(item.unitPrice) * Number(item.quantity)
                    )}
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.warning,
                      fontWeight: 600,
                    }}
                  >
                    {formatMoney(item.taxAmount)}
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

        {/* Financial Breakdown */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Box
            sx={{
              minWidth: { xs: "100%", sm: 320 },
              bgcolor: COLORS.page,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 2.5,
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color={COLORS.muted}>
                  Subtotal:
                </Typography>

                <Typography color={COLORS.text}>
                  {formatMoney(current.subtotal || totalNum)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography
                  color={COLORS.warning}
                  fontWeight={600}
                >
                  Total Tax (GST):
                </Typography>

                <Typography
                  color={COLORS.warning}
                  fontWeight={600}
                >
                  {formatMoney(current.taxTotal || 0)}
                </Typography>
              </Stack>

              <Box
                sx={{
                  borderTop: `1px solid ${COLORS.borderStrong}`,
                  pt: 1.5,
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    color={COLORS.text}
                    fontWeight={700}
                  >
                    Grand Total:
                  </Typography>

                  <Typography
                    color={COLORS.text}
                    fontWeight={700}
                  >
                    {formatMoney(totalNum)}
                  </Typography>
                </Stack>
              </Box>

              <Stack direction="row" justifyContent="space-between">
                <Typography color={COLORS.muted}>
                  Paid Amount:
                </Typography>

                <Typography color={COLORS.text}>
                  {formatMoney(paidNum)}
                </Typography>
              </Stack>

              <Box
                sx={{
                  borderTop: `1px dashed ${COLORS.borderStrong}`,
                  pt: 1.5,
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    color={COLORS.danger}
                    fontWeight={700}
                  >
                    Amount Due:
                  </Typography>

                  <Typography
                    color={COLORS.danger}
                    fontWeight={700}
                  >
                    {formatMoney(outstandingNum)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Accounting Note */}
        <Box
          sx={{
            bgcolor: COLORS.infoSoft,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 2,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: COLORS.muted,
              lineHeight: 1.7,
            }}
          >
            As soon as the Customer Invoice is confirmed, a journal
            entry is created in the Journal Entries section. The Sales
            Journal debits the Debtor account and credits Sales Revenue.
          </Typography>
        </Box>

        {/* Payment Dialog */}
        <Dialog
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              bgcolor: COLORS.card,
              border: `1px solid ${COLORS.borderStrong}`,
              borderRadius: 3,
              color: COLORS.text,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${COLORS.border}`,
              pb: 2,
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              color={COLORS.text}
            >
              Invoice Payment
            </Typography>

            <IconButton
              onClick={() => window.print()}
              sx={{
                color: COLORS.muted,
                "&:hover": {
                  color: COLORS.accent,
                  bgcolor: COLORS.accentSoft,
                },
              }}
            >
              <PrintIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Stack spacing={3} sx={{ pt: 3 }}>
              {payment.isError && (
                <Alert
                  severity="error"
                  sx={{
                    bgcolor: COLORS.dangerSoft,
                    color: COLORS.danger,
                    border: `1px solid ${COLORS.danger}`,
                  }}
                >
                  Payment failed. Check the entered amount.
                </Alert>
              )}

              <FormControl component="fieldset">
                <FormLabel
                  sx={{
                    color: COLORS.muted,
                    mb: 0.5,
                  }}
                >
                  Payment Type
                </FormLabel>

                <RadioGroup
                  row
                  value={payType}
                  onChange={(e) => setPayType(e.target.value)}
                >
                  <FormControlLabel
                    value="SEND"
                    control={
                      <Radio
                        sx={{
                          color: COLORS.muted,
                          "&.Mui-checked": {
                            color: COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Send"
                    disabled
                    sx={{ color: COLORS.muted }}
                  />

                  <FormControlLabel
                    value="RECEIVE"
                    control={
                      <Radio
                        sx={{
                          color: COLORS.muted,
                          "&.Mui-checked": {
                            color: COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Receive"
                    sx={{ color: COLORS.text }}
                  />
                </RadioGroup>
              </FormControl>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                  color={COLORS.muted}
                  minWidth={120}
                >
                  Partner
                </Typography>

                <Typography
                  color={COLORS.text}
                  fontWeight={600}
                >
                  {current.customer.name}
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                  color={COLORS.muted}
                  minWidth={120}
                >
                  Amount
                </Typography>

                <TextField
                  type="number"
                  variant="standard"
                  fullWidth
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                  color={COLORS.muted}
                  minWidth={120}
                >
                  Date
                </Typography>

                <TextField
                  type="date"
                  variant="standard"
                  fullWidth
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                  color={COLORS.muted}
                  minWidth={120}
                >
                  Payment Via
                </Typography>

                <TextField
                  select
                  variant="standard"
                  fullWidth
                  value={paymentVia}
                  onChange={(e) => setPaymentVia(e.target.value)}
                  sx={darkTextFieldSx}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: COLORS.cardHover,
                          color: COLORS.text,
                          border: `1px solid ${COLORS.borderStrong}`,

                          "& .MuiMenuItem-root:hover": {
                            bgcolor: COLORS.accentSoft,
                          },

                          "& .Mui-selected": {
                            bgcolor: COLORS.accentSoft,
                            color: COLORS.accent,
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="Bank">Bank</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                </TextField>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                  color={COLORS.muted}
                  minWidth={120}
                >
                  Memo
                </Typography>

                <TextField
                  variant="standard"
                  fullWidth
                  placeholder="Alpha Numeric (Text)"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  sx={darkTextFieldSx}
                />
              </Stack>
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              p: 3,
              borderTop: `1px solid ${COLORS.border}`,
              gap: 1,
            }}
          >
            <Button
              onClick={() => setPaymentOpen(false)}
              sx={{
                color: COLORS.muted,
                textTransform: "none",

                "&:hover": {
                  color: COLORS.text,
                  bgcolor: COLORS.accentSoft,
                },
              }}
            >
              Cancel
            </Button>

            <CustomButton
              active
              disabled={
                !amount ||
                Number(amount) <= 0 ||
                Number(amount) > outstandingNum ||
                payment.isPending
              }
              onClick={() => payment.mutate()}
            >
              {payment.isPending ? "Confirming..." : "Confirm"}
            </CustomButton>
          </DialogActions>
        </Dialog>
      </Stack>
    </DarkContainer>
  );
};