import { ArrowDownwardOutlined } from "@mui/icons-material";
import { Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Step = ({ label, to, detail }: { label: string; to: string; detail: string }) => <Stack alignItems="center" spacing={.25}><Button component={RouterLink} to={to} variant="outlined" size="small">{label}</Button><Typography variant="caption" color="text.secondary" align="center">{detail}</Typography></Stack>;

export const PurchaseAccountingFlow = () => <Paper sx={{ p: 3 }}>
  <Typography variant="h6" fontWeight={800}>Purchase accounting flow</Typography>
  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Every posted vendor bill is generated and balanced through the centralized accounting service.</Typography>
  <Stack direction={{ xs: "column", md: "row" }} alignItems="center" justifyContent="space-between" spacing={1}>
    <Step label="Vendor" to="/contacts" detail="Active vendor contact" /><ArrowDownwardOutlined sx={{ transform: { md: "rotate(-90deg)" } }} />
    <Step label="Purchase Order" to="/purchase-orders" detail="Confirmed order" /><ArrowDownwardOutlined sx={{ transform: { md: "rotate(-90deg)" } }} />
    <Step label="Vendor Bill" to="/vendor-bills" detail="Posted payable" /><ArrowDownwardOutlined sx={{ transform: { md: "rotate(-90deg)" } }} />
    <Step label="Accounting Service" to="/vendor-bills" detail="Atomic validation & posting" /><ArrowDownwardOutlined sx={{ transform: { md: "rotate(-90deg)" } }} />
    <Step label="Journal Entry" to="/journal-entries" detail="Purchase Journal" /><ArrowDownwardOutlined sx={{ transform: { md: "rotate(-90deg)" } }} />
    <Step label="Journal Lines" to="/journal-entries" detail="Debit equals credit" /><ArrowDownwardOutlined sx={{ transform: { md: "rotate(-90deg)" } }} />
    <Step label="Accounts" to="/accounts" detail="Expense & payable accounts" />
  </Stack>
</Paper>;
