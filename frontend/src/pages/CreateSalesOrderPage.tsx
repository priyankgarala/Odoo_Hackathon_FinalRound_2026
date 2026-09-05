import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as soApi from "../api/sales-orders.api";
import { getContacts } from "../api/contacts.api";
import { getProducts } from "../api/products.api";

type Row = { productId: string; quantity: number; unitPrice: string; taxRate: number };
const money = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(v);

export const CreateSalesOrderPage = () => {
  const nav = useNavigate();
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([{ productId: "", quantity: 1, unitPrice: "", taxRate: 0 }]);

  const customers = useQuery({
    queryKey: ["so-customers"],
    queryFn: () => getContacts({ type: "CUSTOMER", active: "true", page: 1, pageSize: 100 })
  });

  const products = useQuery({
    queryKey: ["so-products"],
    queryFn: () => getProducts({ active: "true", page: 1, pageSize: 100 })
  });

  const save = useMutation({
    mutationFn: () =>
      soApi.createSalesOrder({
        customerId: Number(customerId),
        notes: notes || null,
        items: rows.map((r) => ({
          productId: Number(r.productId),
          quantity: r.quantity,
          unitPrice: r.unitPrice ? Number(r.unitPrice) : undefined,
          taxRate: r.taxRate
        }))
      }),
    onSuccess: (o) => nav(`/sales-orders/${o.id}`)
  });

  const update = (i: number, p: Partial<Row>) => setRows(rows.map((r, n) => (n === i ? { ...r, ...p } : r)));

  const total = rows.reduce((s, r) => {
    const p = Number(r.unitPrice) || Number(products.data?.data.find((x) => x.id === Number(r.productId))?.unitPrice) || 0;
    return s + p * r.quantity * (1 + r.taxRate / 100);
  }, 0);

  return (
    <Stack spacing={3} sx={{ maxWidth: 1000, mx: "auto", pt: 2 }}>
      <Box>
        <Typography variant="h4" fontWeight={750}>Create Sales Order</Typography>
        <Typography color="text.secondary">Draft customer sales order with price and tax snapshots.</Typography>
      </Box>

      {save.isError && <Alert severity="error">Could not create sales order. Check all required fields.</Alert>}

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Customer</InputLabel>
            <Select label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <MenuItem value="">Select customer</MenuItem>
              {customers.data?.data.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={2}
          />

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Tax %</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={r.productId}
                        displayEmpty
                        onChange={(e) => {
                          const prod = products.data?.data.find((x) => x.id === Number(e.target.value));
                          update(i, {
                            productId: e.target.value,
                            unitPrice: prod ? String(prod.unitPrice) : ""
                          });
                        }}
                      >
                        <MenuItem value="">Select product</MenuItem>
                        {products.data?.data.map((p) => (
                          <MenuItem key={p.id} value={String(p.id)}>{p.sku} · {p.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={r.quantity}
                      onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={r.unitPrice}
                      placeholder="Sales price"
                      onChange={(e) => update(i, { unitPrice: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={r.taxRate}
                      onChange={(e) => update(i, { taxRate: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      disabled={rows.length === 1}
                      onClick={() => setRows(rows.filter((_, n) => n !== i))}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Button
            startIcon={<AddIcon />}
            onClick={() => setRows([...rows, { productId: "", quantity: 1, unitPrice: "", taxRate: 0 }])}
            sx={{ alignSelf: "flex-start" }}
          >
            Add Item
          </Button>

          <Typography align="right" variant="h6">Total: {money(total)}</Typography>

          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button onClick={() => nav("/sales-orders")}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!customerId || rows.some((r) => !r.productId || r.quantity <= 0) || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Saving..." : "Save Draft Sales Order"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};
