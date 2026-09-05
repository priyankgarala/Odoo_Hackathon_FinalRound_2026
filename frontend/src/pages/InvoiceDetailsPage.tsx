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
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as invoicesApi from "../api/invoices.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";

const formatMoney = (value: string | number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);

const DarkContainer = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <Box sx={{ width: "100%", maxWidth: 1050, mx: "auto", pt: 4 }}>
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

const darkTextFieldSx = {
  "& .MuiInputBase-root": { color: "rgba(255,255,255,0.9)" },
  "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.3)" },
  "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottomColor: "rgba(255,255,255,0.7)" },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.6)" }
};

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

export const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [payType, setPayType] = useState("RECEIVE");
  const [amount, setAmount] = useState("");
  const [paymentVia, setPaymentVia] = useState("Bank");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");

  const invoice = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.getInvoice(Number(id)),
    enabled: Boolean(id)
  });

  const payment = useMutation({
    mutationFn: () =>
      invoicesApi.payInvoice({
        id: Number(id),
        amount: Number(amount),
        paymentMethod: paymentVia,
        reference: memo || undefined
      }),
    onSuccess: () => {
      setSuccess(`Customer payment of ${formatMoney(amount)} completed and posted to ${paymentVia} Journal.`);
      setPaymentOpen(false);
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  });

  if (invoice.isLoading) return <LoadingState label="Loading customer invoice..." />;
  if (invoice.isError || !invoice.data)
    return <ErrorState message="Invoice could not be loaded." onRetry={() => void invoice.refetch()} />;

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
    statusLabel === "Paid" ? "#81c784" : statusLabel === "Part Paid" ? "#ffb74d" : "#ff8a80";

  const paidViaBank = current.payments?.filter((p) => p.paymentMethod?.toLowerCase().includes("bank")).reduce((s, p) => s + Number(p.amount), 0) || 0;
  const paidViaCash = current.payments?.filter((p) => p.paymentMethod?.toLowerCase().includes("cash")).reduce((s, p) => s + Number(p.amount), 0) || 0;

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
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            {outstandingNum > 0 && (
              <CustomButton active onClick={openPaymentModal}>
                Pay
              </CustomButton>
            )}
          </Stack>

          {/* Smart buttons */}
          <Stack direction="row" spacing={2} alignItems="center">
            {current.salesOrder && (
              <CustomButton
                component={RouterLink}
                to={`/sales-orders/${current.salesOrder.id}`}
                sx={{ borderColor: "#90caf9", color: "#90caf9" }}
              >
                SO
              </CustomButton>
            )}
            <CustomButton
              component={RouterLink}
              to="/reports/budget"
              sx={{ borderColor: "#81c784", color: "#81c784" }}
            >
              Budget
            </CustomButton>
            <CustomButton onClick={() => window.print()}>Print</CustomButton>
            <CustomButton onClick={() => navigate("/invoices")}>Back</CustomButton>
          </Stack>
        </Stack>

        {success && <Alert severity="success">{success}</Alert>}

        {/* Invoice Header Info */}
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={4}>
          <Stack spacing={2} flex={1}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Customer Invoice No.</Typography>
              <Typography color="#90caf9" fontWeight={700} variant="h6">{current.invoiceNumber}</Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Customer Name</Typography>
              <Typography color="white" fontWeight={600}>{current.customer.name}</Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Status</Typography>
              <Chip
                label={statusLabel}
                sx={{
                  bgcolor: `${statusColor}22`,
                  color: statusColor,
                  fontWeight: 700,
                  border: `1px solid ${statusColor}`
                }}
              />
            </Stack>
          </Stack>

          <Stack spacing={2} flex={1}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={140}>Invoice Reference</Typography>
              <Typography color="rgba(255,255,255,0.8)">{current.invoiceNumber}</Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={140}>Invoice Date</Typography>
              <Typography color="white">
                {new Date(current.invoiceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={140}>Due Date</Typography>
              <Typography color="white">
                {new Date(current.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Items Table */}
        <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                <TableCell sx={{ color: "white", width: 40 }}>Sr.</TableCell>
                <TableCell sx={{ color: "white" }}>Product</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 70 }}>Qty</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 110 }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 110 }}>Subtotal</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 100 }}>Tax Amount</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 120 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {current.items?.map((item, idx) => (
                <TableRow key={item.id} sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{idx + 1}.</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    {item.productName}
                    {item.taxLines && item.taxLines.length > 0 && (
                      <Box sx={{ mt: 0.5, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {item.taxLines.map((tl) => (
                          <Chip
                            key={tl.id}
                            label={`${tl.taxName}: ${formatMoney(tl.taxAmount)}`}
                            size="small"
                            sx={{ bgcolor: "rgba(59, 130, 246, 0.2)", color: "#93c5fd", fontSize: "0.7rem", height: 20 }}
                          />
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "white" }}>{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ color: "white" }}>{formatMoney(item.unitPrice)}</TableCell>
                  <TableCell align="right" sx={{ color: "white" }}>{formatMoney(item.lineSubtotal || Number(item.unitPrice) * Number(item.quantity))}</TableCell>
                  <TableCell align="right" sx={{ color: "#d97706", fontWeight: 600 }}>{formatMoney(item.taxAmount)}</TableCell>
                  <TableCell align="right" sx={{ color: "white", fontWeight: 600 }}>{formatMoney(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Bottom Breakdown per wireframe */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Stack spacing={1} sx={{ minWidth: 280, borderTop: "1px solid rgba(255,255,255,0.2)", pt: 2 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="rgba(255,255,255,0.7)">Subtotal:</Typography>
              <Typography color="white">{formatMoney(current.subtotal || totalNum)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="#d97706" fontWeight={600}>Total Tax (GST):</Typography>
              <Typography color="#d97706" fontWeight={600}>{formatMoney(current.taxTotal || 0)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", pt: 0.5 }}>
              <Typography color="white" fontWeight={700}>Grand Total:</Typography>
              <Typography color="white" fontWeight={700}>{formatMoney(totalNum)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="rgba(255,255,255,0.6)">Paid Amount:</Typography>
              <Typography color="rgba(255,255,255,0.8)">{formatMoney(paidNum)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ borderTop: "1px dashed rgba(255,255,255,0.2)", pt: 1 }}>
              <Typography color="#ff8a80" fontWeight={700}>Amount Due:</Typography>
              <Typography color="#ff8a80" fontWeight={700}>{formatMoney(outstandingNum)}</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Note from wireframe */}
        <Typography variant="body2" color="rgba(255,255,255,0.4)">
          As soon as the Customer Invoice is confirmed a journal entry is created in the Journal Entries section (Sales Journal debits Debtor, credits Sales Revenue).
        </Typography>

        {/* Invoice Payment Modal (matching wireframe) */}
        <Dialog
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { bgcolor: "#181818", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "white" }
          }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight={700}>Invoice Payment</Typography>
            <IconButton onClick={() => window.print()} sx={{ color: "rgba(255,255,255,0.7)" }}>
              <PrintIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Stack spacing={3} sx={{ pt: 1 }}>
              {payment.isError && <Alert severity="error">Payment failed. Check the entered amount.</Alert>}

              <FormControl component="fieldset">
                <FormLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Payment Type</FormLabel>
                <RadioGroup row value={payType} onChange={(e) => setPayType(e.target.value)}>
                  <FormControlLabel value="SEND" control={<Radio sx={{ color: "white" }} />} label="Send" disabled />
                  <FormControlLabel value="RECEIVE" control={<Radio sx={{ color: "white" }} />} label="Receive" />
                </RadioGroup>
              </FormControl>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography color="rgba(255,255,255,0.7)" minWidth={120}>Partner</Typography>
                <Typography color="white" fontWeight={600}>{current.customer.name}</Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography color="rgba(255,255,255,0.7)" minWidth={120}>Amount</Typography>
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
                <Typography color="rgba(255,255,255,0.7)" minWidth={120}>Date</Typography>
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
                <Typography color="rgba(255,255,255,0.7)" minWidth={120}>Payment Via</Typography>
                <TextField
                  select
                  variant="standard"
                  fullWidth
                  value={paymentVia}
                  onChange={(e) => setPaymentVia(e.target.value)}
                  sx={darkTextFieldSx}
                  SelectProps={{
                    MenuProps: { PaperProps: { sx: { bgcolor: "#1e1e1e", color: "white" } } }
                  }}
                >
                  <MenuItem value="Bank">Bank</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                </TextField>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography color="rgba(255,255,255,0.7)" minWidth={120}>Memo</Typography>
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

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setPaymentOpen(false)} sx={{ color: "white" }}>Cancel</Button>
            <CustomButton
              active
              disabled={!amount || Number(amount) <= 0 || Number(amount) > outstandingNum || payment.isPending}
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
