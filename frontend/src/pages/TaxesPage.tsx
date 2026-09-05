import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import PercentageIcon from "@mui/icons-material/Percent";
import SearchIcon from "@mui/icons-material/Search";
import { getTaxes, createTax, updateTax, setTaxStatus, type Tax, type TaxType } from "../api/taxes.api";
import { getAccounts, type Account } from "../api/accounts.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";

const cardBg = "#111827";
const subtleBorder = "#1f2937";
const headBg = "#1f2937";
const rowHover = "#1e293b";
const textMuted = "#9ca3af";
const goldAccent = "#d97706";

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const [openModal, setOpenModal] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    type: "GST" as TaxType,
    salesAccountId: "",
    purchaseAccountId: "",
    isActive: true
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [taxRes, accRes] = await Promise.all([
        getTaxes({
          search: search.trim() || undefined,
          type: typeFilter !== "ALL" ? (typeFilter as TaxType) : undefined,
          pageSize: 100
        }),
        getAccounts()
      ]);
      setTaxes(taxRes.data);
      setAccounts(accRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to fetch tax configuration");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (tax?: Tax) => {
    setFormError(null);
    if (tax) {
      setEditingTax(tax);
      setFormData({
        name: tax.name,
        rate: tax.rate,
        type: tax.type,
        salesAccountId: String(tax.salesAccountId),
        purchaseAccountId: String(tax.purchaseAccountId),
        isActive: tax.isActive
      });
    } else {
      setEditingTax(null);
      // Select default sales and purchase tax accounts if found
      const defaultSalesAcc = accounts.find((a) => a.code === "2100") || accounts[0];
      const defaultPurAcc = accounts.find((a) => a.code === "1300" || a.code === "2100") || accounts[0];

      setFormData({
        name: "",
        rate: "18",
        type: "GST",
        salesAccountId: defaultSalesAcc ? String(defaultSalesAcc.id) : "",
        purchaseAccountId: defaultPurAcc ? String(defaultPurAcc.id) : "",
        isActive: true
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingTax(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Tax name is required");
      return;
    }
    const rateNum = parseFloat(formData.rate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      setFormError("Rate must be between 0 and 100");
      return;
    }
    if (!formData.salesAccountId) {
      setFormError("Sales Tax Account is required");
      return;
    }
    if (!formData.purchaseAccountId) {
      setFormError("Purchase Tax Account is required");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        name: formData.name.trim(),
        rate: rateNum,
        type: formData.type,
        salesAccountId: Number(formData.salesAccountId),
        purchaseAccountId: Number(formData.purchaseAccountId),
        isActive: formData.isActive
      };

      if (editingTax) {
        await updateTax({ id: editingTax.id, input: payload });
      } else {
        await createTax(payload);
      }

      handleCloseModal();
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || "Failed to save tax entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tax: Tax) => {
    try {
      await setTaxStatus({ id: tax.id, isActive: !tax.isActive });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to toggle tax status");
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: "#ffffff", fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 1.5 }}>
            <PercentageIcon sx={{ color: goldAccent, fontSize: 32 }} /> Tax Master & Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: textMuted }}>
            Configure GST and custom transactional tax rates linked to Chart of Accounts.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={fetchData}
            startIcon={<RefreshIcon />}
            sx={{ borderColor: subtleBorder, color: "#e5e7eb", "&:hover": { borderColor: goldAccent, bgcolor: "rgba(217, 119, 6, 0.1)" } }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={() => handleOpenModal()}
            startIcon={<AddIcon />}
            sx={{ bgcolor: goldAccent, color: "#ffffff", "&:hover": { bgcolor: "#b45309" } }}
          >
            Create Tax Rate
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: cardBg, borderColor: subtleBorder, borderWidth: 1, borderStyle: "solid", borderRadius: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search tax name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: textMuted, mr: 1, fontSize: 20 }} />,
          }}
          sx={{
            width: 300,
            "& .MuiOutlinedInput-root": {
              bgcolor: "#030712",
              color: "#ffffff",
              "& fieldset": { borderColor: subtleBorder }
            }
          }}
        />

        <TextField
          select
          size="small"
          label="Tax Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{
            width: 160,
            "& .MuiOutlinedInput-root": {
              bgcolor: "#030712",
              color: "#ffffff",
              "& fieldset": { borderColor: subtleBorder }
            },
            "& .MuiInputLabel-root": { color: textMuted }
          }}
        >
          <MenuItem value="ALL">All Types</MenuItem>
          <MenuItem value="GST">GST</MenuItem>
          <MenuItem value="OTHER">Other / Flat</MenuItem>
        </TextField>
      </Paper>

      {/* Main Content */}
      {loading ? (
        <LoadingState message="Loading tax configuration..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : taxes.length === 0 ? (
        <EmptyState
          title="No Tax Rates Found"
          description="Create your first tax master entry to configure sales & purchase taxes."
          actionLabel="Create Tax Rate"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: cardBg, borderColor: subtleBorder, borderWidth: 1, borderStyle: "solid", borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: headBg }}>
              <TableRow>
                <TableCell sx={{ color: "#9ca3af", fontWeight: 600 }}>Tax Name</TableCell>
                <TableCell sx={{ color: "#9ca3af", fontWeight: 600 }}>Rate (%)</TableCell>
                <TableCell sx={{ color: "#9ca3af", fontWeight: 600 }}>Tax Type</TableCell>
                <TableCell sx={{ color: "#9ca3af", fontWeight: 600 }}>Sales Output Account</TableCell>
                <TableCell sx={{ color: "#9ca3af", fontWeight: 600 }}>Purchase Input Account</TableCell>
                <TableCell sx={{ color: "#9ca3af", fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ color: "#9ca3af", fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {taxes.map((tax) => (
                <TableRow
                  key={tax.id}
                  sx={{
                    "&:hover": { bgcolor: rowHover },
                    borderBottomColor: subtleBorder
                  }}
                >
                  <TableCell sx={{ color: "#ffffff", fontWeight: 600 }}>
                    {tax.name}
                  </TableCell>
                  <TableCell sx={{ color: goldAccent, fontWeight: 700, fontSize: "1.05rem" }}>
                    {parseFloat(tax.rate).toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tax.type}
                      size="small"
                      sx={{
                        bgcolor: tax.type === "GST" ? "rgba(59, 130, 246, 0.15)" : "rgba(168, 85, 247, 0.15)",
                        color: tax.type === "GST" ? "#60a5fa" : "#c084fc",
                        fontWeight: 600,
                        border: "1px solid",
                        borderColor: tax.type === "GST" ? "rgba(59, 130, 246, 0.3)" : "rgba(168, 85, 247, 0.3)"
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#e5e7eb" }}>
                    {tax.salesAccount ? `${tax.salesAccount.code} - ${tax.salesAccount.name}` : `Account ID ${tax.salesAccountId}`}
                  </TableCell>
                  <TableCell sx={{ color: "#e5e7eb" }}>
                    {tax.purchaseAccount ? `${tax.purchaseAccount.code} - ${tax.purchaseAccount.name}` : `Account ID ${tax.purchaseAccountId}`}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tax.isActive ? "Active" : "Inactive"}
                      size="small"
                      color={tax.isActive ? "success" : "default"}
                      sx={{
                        bgcolor: tax.isActive ? "rgba(34, 197, 94, 0.15)" : "rgba(156, 163, 175, 0.15)",
                        color: tax.isActive ? "#4ade80" : "#9ca3af",
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Tax">
                      <IconButton onClick={() => handleOpenModal(tax)} sx={{ color: "#60a5fa" }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={tax.isActive ? "Deactivate Tax" : "Activate Tax"}>
                      <Switch
                        size="small"
                        checked={tax.isActive}
                        onChange={() => handleToggleStatus(tax)}
                        color="warning"
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: cardBg, borderColor: subtleBorder, borderWidth: 1, borderStyle: "solid", color: "#ffffff" } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ borderBottom: `1px solid ${subtleBorder}`, fontWeight: 700, color: "#ffffff" }}>
            {editingTax ? "Edit Tax Configuration" : "Create New Tax Rate"}
          </DialogTitle>

          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Tax Name"
              required
              fullWidth
              placeholder="e.g. GST 18% or Luxury Furniture Surcharge"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#030712", color: "#ffffff", "& fieldset": { borderColor: subtleBorder } },
                "& .MuiInputLabel-root": { color: textMuted }
              }}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Tax Rate (%)"
                type="number"
                required
                fullWidth
                inputProps={{ step: "0.01", min: "0", max: "100" }}
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "#030712", color: "#ffffff", "& fieldset": { borderColor: subtleBorder } },
                  "& .MuiInputLabel-root": { color: textMuted }
                }}
              />

              <TextField
                select
                label="Type"
                required
                fullWidth
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as TaxType })}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "#030712", color: "#ffffff", "& fieldset": { borderColor: subtleBorder } },
                  "& .MuiInputLabel-root": { color: textMuted }
                }}
              >
                <MenuItem value="GST">GST (Intra/Inter state breakdown)</MenuItem>
                <MenuItem value="OTHER">OTHER (Flat / Standard)</MenuItem>
              </TextField>
            </Box>

            <TextField
              select
              label="Sales Output Tax Account (Liability)"
              required
              fullWidth
              value={formData.salesAccountId}
              onChange={(e) => setFormData({ ...formData, salesAccountId: e.target.value })}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#030712", color: "#ffffff", "& fieldset": { borderColor: subtleBorder } },
                "& .MuiInputLabel-root": { color: textMuted }
              }}
            >
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={String(acc.id)}>
                  {acc.code} - {acc.name} ({acc.type})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Purchase Input Tax Account (Asset/Credit)"
              required
              fullWidth
              value={formData.purchaseAccountId}
              onChange={(e) => setFormData({ ...formData, purchaseAccountId: e.target.value })}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#030712", color: "#ffffff", "& fieldset": { borderColor: subtleBorder } },
                "& .MuiInputLabel-root": { color: textMuted }
              }}
            >
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={String(acc.id)}>
                  {acc.code} - {acc.name} ({acc.type})
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  color="warning"
                />
              }
              label="Active Tax Rate"
              sx={{ color: "#e5e7eb" }}
            />
          </DialogContent>

          <DialogActions sx={{ borderTop: `1px solid ${subtleBorder}`, px: 3, py: 2 }}>
            <Button onClick={handleCloseModal} sx={{ color: textMuted }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: goldAccent, color: "#ffffff", "&:hover": { bgcolor: "#b45309" } }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : editingTax ? "Update Tax" : "Create Tax"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
