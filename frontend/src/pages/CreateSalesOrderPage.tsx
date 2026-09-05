import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as soApi from "../api/sales-orders.api";
import { getContacts } from "../api/contacts.api";
import { getProducts } from "../api/products.api";

type Row = { productId: string; quantity: number; unitPrice: string; taxId: string; taxRate: number };

const formatMoney = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(v);

const DarkContainer = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pt: 4, pb: 6 }}>
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

const darkSelectProps = {
  MenuProps: {
    PaperProps: {
      sx: {
        bgcolor: "#1e1e1e",
        color: "rgba(255,255,255,0.9)",
        maxHeight: 300,
        "& .MuiMenuItem-root:hover": { bgcolor: "rgba(255,255,255,0.1)" },
        "& .Mui-selected": { bgcolor: "rgba(255,255,255,0.2) !important" }
      }
    }
  }
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

export const CreateSalesOrderPage = () => {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState("");
  const [soDate, setSoDate] = useState(new Date().toISOString().slice(0, 10));
  const [soNo, setSoNo] = useState(`SO${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([{ productId: "", quantity: 1, unitPrice: "", taxId: "", taxRate: 0 }]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const customers = useQuery({
    queryKey: ["so-customers"],
    queryFn: () => getContacts({ active: "true", page: 1, pageSize: 100 })
  });

  const customerList = (customers.data?.data ?? []).filter((c) => c.type === "CUSTOMER" || c.type === "BOTH");

  const products = useQuery({
    queryKey: ["so-products"],
    queryFn: () => getProducts({ active: "true", page: 1, pageSize: 100 })
  });

  const taxes = useQuery({
    queryKey: ["so-taxes"],
    queryFn: () => import("../api/taxes.api").then((m) => m.getTaxes({ pageSize: 100 }))
  });

  const save = useMutation({
    mutationFn: () =>
      soApi.createSalesOrder({
        customerId: Number(customerId),
        notes: notes.trim() || null,
        items: rows.map((r) => ({
          productId: Number(r.productId),
          quantity: Number(r.quantity),
          unitPrice: r.unitPrice !== "" && !isNaN(Number(r.unitPrice)) ? Number(r.unitPrice) : undefined,
          taxId: r.taxId ? Number(r.taxId) : null,
          taxRate: Number(r.taxRate) || 0
        }))
      }),
    onSuccess: (o) => navigate(`/sales-orders/${o.id}`)
  });

  const handleResetNew = () => {
    setCustomerId("");
    setSoDate(new Date().toISOString().slice(0, 10));
    setSoNo(`SO${Math.floor(1000 + Math.random() * 9000)}`);
    setNotes("");
    setRows([{ productId: "", quantity: 1, unitPrice: "", taxId: "", taxRate: 0 }]);
    setValidationError(null);
  };

  const update = (i: number, p: Partial<Row>) => setRows(rows.map((r, n) => (n === i ? { ...r, ...p } : r)));

  const handleConfirm = () => {
    setValidationError(null);
    if (!customerId) {
      setValidationError("Please select a customer.");
      return;
    }
    if (rows.length === 0) {
      setValidationError("Please add at least one line item.");
      return;
    }
    const invalidRow = rows.find((r) => !r.productId || Number(r.quantity) <= 0);
    if (invalidRow) {
      setValidationError("Please select a product and valid quantity (> 0) for all lines.");
      return;
    }
    save.mutate();
  };

  const total = rows.reduce((s, r) => {
    const p = Number(r.unitPrice) || Number(products.data?.data.find((x) => x.id === Number(r.productId))?.unitPrice) || 0;
    return s + p * r.quantity * (1 + (Number(r.taxRate) || 0) / 100);
  }, 0);

  const serverError = axios.isAxiosError(save.error)
    ? (save.error.response?.data as any)?.error ?? "Could not create sales order."
    : save.error
    ? "Could not create sales order."
    : null;

  return (
    <DarkContainer title="Sales Order">
      <Stack spacing={4}>
        {/* Header Toolbar */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <CustomButton active onClick={handleResetNew}>
              New
            </CustomButton>
            <CustomButton
              disabled={save.isPending}
              onClick={handleConfirm}
            >
              {save.isPending ? "Confirming..." : "Confirm"}
            </CustomButton>
          </Stack>
          <Stack direction="row" spacing={2}>
            <CustomButton onClick={() => navigate("/sales-orders")}>Cancel</CustomButton>
            <CustomButton onClick={() => navigate("/sales-orders")}>Back</CustomButton>
          </Stack>
        </Stack>

        {validationError && (
          <Alert severity="warning" sx={{ bgcolor: "rgba(237, 108, 2, 0.2)", color: "#ffb74d" }}>
            {validationError}
          </Alert>
        )}

        {serverError && (
          <Alert severity="error" sx={{ bgcolor: "rgba(211, 47, 47, 0.2)", color: "#ffb4ab" }}>
            {serverError}
          </Alert>
        )}

        {/* Header Fields */}
        <Stack spacing={2} maxWidth={650}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="white" minWidth={140}>SO No.</Typography>
            <Typography color="#90caf9" fontWeight={700}>{soNo}</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="white" minWidth={140}>Customer Name</Typography>
            <TextField
              select
              SelectProps={darkSelectProps}
              variant="standard"
              fullWidth
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setValidationError(null);
              }}
              sx={darkTextFieldSx}
            >
              <MenuItem value="" disabled>Select Customer</MenuItem>
              {customerList.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="white" minWidth={140}>Order Date</Typography>
            <TextField
              type="date"
              variant="standard"
              fullWidth
              value={soDate}
              onChange={(e) => setSoDate(e.target.value)}
              sx={darkTextFieldSx}
            />
          </Stack>
        </Stack>

        {/* Line Items Table */}
        <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)", bgcolor: "#161616" }}>
                <TableCell sx={{ color: "white", width: 40 }}>Sr.</TableCell>
                <TableCell sx={{ color: "white" }}>Product</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 90 }}>Qty</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 130 }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 150 }}>Tax Rate</TableCell>
                <TableCell align="right" sx={{ color: "white", width: 130 }}>Total</TableCell>
                <TableCell sx={{ color: "white", width: 40 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => {
                const prod = products.data?.data.find((x) => x.id === Number(r.productId));
                const price = r.unitPrice !== "" ? Number(r.unitPrice) : Number(prod?.unitPrice || 0);
                const lineTotal = price * (Number(r.quantity) || 0) * (1 + (Number(r.taxRate) || 0) / 100);
                return (
                  <TableRow key={i} sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{i + 1}.</TableCell>
                    <TableCell>
                      <TextField
                        select
                        SelectProps={darkSelectProps}
                        variant="standard"
                        fullWidth
                        value={r.productId}
                        onChange={(e) => {
                          const p = products.data?.data.find((x) => x.id === Number(e.target.value));
                          const autoPrice = p ? String(p.unitPrice || 0) : "";
                          const autoTaxId = p?.defaultTaxId ? String(p.defaultTaxId) : "";
                          const autoTaxRate = p?.defaultTax ? Number(p.defaultTax.rate) : 0;

                          update(i, {
                            productId: e.target.value,
                            unitPrice: autoPrice,
                            taxId: autoTaxId,
                            taxRate: autoTaxRate
                          });
                          setValidationError(null);
                        }}
                        sx={darkTextFieldSx}
                      >
                        <MenuItem value="" disabled>Select Product</MenuItem>
                        {products.data?.data.map((p) => (
                          <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        variant="standard"
                        value={r.quantity}
                        onChange={(e) => {
                          update(i, { quantity: Math.max(1, Number(e.target.value) || 1) });
                          setValidationError(null);
                        }}
                        sx={darkTextFieldSx}
                        inputProps={{ min: 1, style: { textAlign: "right" } }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        variant="standard"
                        value={r.unitPrice}
                        placeholder="Price"
                        onChange={(e) => update(i, { unitPrice: e.target.value })}
                        sx={darkTextFieldSx}
                        inputProps={{ style: { textAlign: "right" } }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        select
                        SelectProps={darkSelectProps}
                        variant="standard"
                        fullWidth
                        value={r.taxId}
                        onChange={(e) => {
                          const selectedTax = taxes.data?.data.find((t) => t.id === Number(e.target.value));
                          update(i, {
                            taxId: e.target.value,
                            taxRate: selectedTax ? Number(selectedTax.rate) : 0
                          });
                        }}
                        sx={darkTextFieldSx}
                      >
                        <MenuItem value="">Custom / No Tax (0%)</MenuItem>
                        {taxes.data?.data.map((t) => (
                          <MenuItem key={t.id} value={String(t.id)}>
                            {t.name} ({parseFloat(t.rate)}%)
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="right" sx={{ color: "white", fontWeight: 600 }}>
                      {formatMoney(lineTotal)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        disabled={rows.length === 1}
                        onClick={() => setRows(rows.filter((_, n) => n !== i))}
                        sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "red" } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            startIcon={<AddIcon />}
            onClick={() => setRows([...rows, { productId: "", quantity: 1, unitPrice: "", taxRate: 0 }])}
            sx={{ color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.3)", textTransform: "none" }}
            variant="outlined"
          >
            Add Line
          </Button>
          <Typography variant="h6" color="white" fontWeight={700}>
            Total: {formatMoney(total)}
          </Typography>
        </Stack>
      </Stack>
    </DarkContainer>
  );
};
