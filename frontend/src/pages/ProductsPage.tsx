import { useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as productsApi from "../api/products.api";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";

const blank: productsApi.ProductInput = {
  name: "",
  type: "GOODS",
  unitPrice: 0,
  costPrice: 0,
  category: "",
  description: "",
  image: null
};

const apiError = (error: unknown) =>
  axios.isAxiosError<{ error?: string }>(error)
    ? error.response?.data?.error ?? "Request failed."
    : "Request failed.";

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

const formatMoney = (amount: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(amount) || 0);

export const ProductsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = ["Admin", "Accountant", "Sales", "Purchase"].includes(user?.role ?? "");

  const [screen, setScreen] = useState<"list" | "form">("list");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<productsApi.ProductInput>(blank);
  const [editing, setEditing] = useState<productsApi.Product | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const params = useMemo(() => ({ search: search || undefined, page, pageSize: 12 }), [search, page]);
  const products = useQuery({ queryKey: ["products", params], queryFn: () => productsApi.getProducts(params) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const save = useMutation({
    mutationFn: (payload: productsApi.ProductInput) =>
      editing ? productsApi.updateProduct({ id: editing.id, input: payload }) : productsApi.createProduct(payload),
    onSuccess: () => {
      setScreen("list");
      setEditing(null);
      setForm(blank);
      refresh();
    }
  });

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setValidationError(null);
    setScreen("form");
  };

  const openRecord = (prod: productsApi.Product) => {
    setEditing(prod);
    setForm({
      sku: prod.sku,
      name: prod.name,
      type: prod.type || "GOODS",
      unitPrice: Number(prod.unitPrice),
      costPrice: Number(prod.costPrice) || 0,
      category: prod.category || "",
      description: prod.description || "",
      image: prod.image
    });
    setValidationError(null);
    setScreen("form");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || form.name.trim().length < 2) {
      setValidationError("Product Name must be at least 2 characters long.");
      return;
    }
    if (form.unitPrice < 0) {
      setValidationError("Sales Price cannot be negative.");
      return;
    }
    if ((form.costPrice ?? 0) < 0) {
      setValidationError("Cost cannot be negative.");
      return;
    }
    setValidationError(null);
    save.mutate(form);
  };

  if (screen === "form") {
    return (
      <DarkContainer>
        <Stack component="form" onSubmit={submit} spacing={4}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2}>
              <CustomButton type="submit" disabled={save.isPending}>
                {save.isPending ? "..." : "Confirm"}
              </CustomButton>
            </Stack>
            <CustomButton onClick={() => { setScreen("list"); setEditing(null); }}>
              Back
            </CustomButton>
          </Stack>

          {validationError && <Alert severity="warning">{validationError}</Alert>}
          {save.isError && <Alert severity="error">{apiError(save.error)}</Alert>}

          <Stack direction={{ xs: "column", md: "row" }} spacing={6}>
            <Stack spacing={3} flex={1}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography color="white" minWidth={140}>Product Name</Typography>
                <TextField
                  variant="standard"
                  fullWidth
                  placeholder="e.g. Office Chair"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography color="white" minWidth={140}>Product Type</Typography>
                <TextField
                  select
                  SelectProps={darkSelectProps}
                  variant="standard"
                  fullWidth
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as productsApi.ProductType })}
                  sx={darkTextFieldSx}
                >
                  <MenuItem value="GOODS">Goods</MenuItem>
                  <MenuItem value="SERVICE">Service</MenuItem>
                  <MenuItem value="COMBO">Combo</MenuItem>
                </TextField>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography color="white" minWidth={140}>Category</Typography>
                <TextField
                  variant="standard"
                  fullWidth
                  placeholder="e.g. Electronics, Furniture"
                  value={form.category ?? ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography color="white" minWidth={140}>Sales Price (Rs.)</Typography>
                <TextField
                  variant="standard"
                  type="number"
                  fullWidth
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography color="white" minWidth={140}>Cost (Rs.)</Typography>
                <TextField
                  variant="standard"
                  type="number"
                  fullWidth
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                  sx={darkTextFieldSx}
                />
              </Stack>
            </Stack>

            <Box
              component="label"
              sx={{
                width: 200,
                height: 200,
                border: "1px dashed rgba(255,255,255,0.3)",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                "&:hover": { borderColor: "white" }
              }}
            >
              <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              {form.image ? (
                <Box component="img" src={form.image} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Typography color="rgba(255,255,255,0.5)">Upload Image</Typography>
              )}
            </Box>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedProducts = products.data?.data ?? [];

  return (
    <DarkContainer title="Master Data">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <CustomButton onClick={openCreate}>New</CustomButton>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search product..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            sx={{
              width: 300,
              input: { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&:hover fieldset": { borderColor: "white" }
              }
            }}
          />
          <Stack direction="row" spacing={2} alignItems="center">
            <CustomButton onClick={() => setScreen("list")}>Back</CustomButton>
            <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, next) => next && setView(next)} sx={{ bgcolor: "white", borderRadius: 1 }}>
              <ToggleButton value="list"><ViewListIcon sx={{ color: "black" }} /></ToggleButton>
              <ToggleButton value="kanban"><ViewModuleIcon sx={{ color: "black" }} /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {products.isLoading ? (
          <LoadingState label="Loading products..." />
        ) : products.isError ? (
          <ErrorState message={apiError(products.error)} onRetry={() => void products.refetch()} />
        ) : renderedProducts.length === 0 ? (
          <EmptyState message="No products found. Click 'New' to create one." />
        ) : view === "list" ? (
          <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Select</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Product</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Category</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Type</TableCell>
                  <TableCell align="right" sx={{ color: "white", borderBottom: "none" }}>Sales Price</TableCell>
                  <TableCell align="right" sx={{ color: "white", borderBottom: "none" }}>Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderedProducts.map((prod) => (
                  <TableRow
                    key={prod.id}
                    hover
                    onClick={() => openRecord(prod)}
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <TableCell sx={{ borderBottom: "none" }}>
                      <Checkbox size="small" sx={{ color: "rgba(255,255,255,0.5)" }} onClick={(e) => e.stopPropagation()} />
                    </TableCell>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        {prod.image ? (
                          <Box component="img" src={prod.image} sx={{ width: 32, height: 32, borderRadius: 1, objectFit: "cover" }} />
                        ) : (
                          <Inventory2OutlinedIcon sx={{ color: "rgba(255,255,255,0.4)" }} />
                        )}
                        <Typography color="white" fontWeight={600}>{prod.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>{prod.category || "—"}</TableCell>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>
                      <Chip size="small" label={prod.type || "GOODS"} sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white" }} />
                    </TableCell>
                    <TableCell align="right" sx={{ color: "white", borderBottom: "none", fontWeight: 600 }}>
                      {formatMoney(prod.unitPrice)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "rgba(255,255,255,0.7)", borderBottom: "none" }}>
                      {formatMoney(prod.costPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 3, pt: 2 }}>
            {renderedProducts.map((prod) => (
              <Paper
                key={prod.id}
                variant="outlined"
                onClick={() => openRecord(prod)}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  bgcolor: "transparent",
                  borderColor: "rgba(255,255,255,0.3)",
                  borderRadius: 3,
                  "&:hover": { borderColor: "white" }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 64, height: 64, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {prod.image ? (
                      <Box component="img" src={prod.image} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Inventory2OutlinedIcon sx={{ fontSize: 36, color: "rgba(255,255,255,0.4)" }} />
                    )}
                  </Box>
                  <Stack spacing={0.5} overflow="hidden">
                    <Typography color="white" fontWeight={700} noWrap>{prod.name}</Typography>
                    <Typography color="rgba(255,255,255,0.75)" variant="body2">
                      Sales Price: {formatMoney(prod.unitPrice)}
                    </Typography>
                    <Typography color="rgba(255,255,255,0.5)" variant="body2">
                      Cost: {formatMoney(prod.costPrice)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="rgba(255,255,255,0.5)">
            {products.data?.meta.total ?? 0} products
          </Typography>
          <Pagination
            page={page}
            count={Math.max(1, products.data?.meta.totalPages ?? 1)}
            onChange={(_, value) => setPage(value)}
            sx={{ "& .MuiPaginationItem-root": { color: "white" } }}
          />
        </Box>
      </Stack>
    </DarkContainer>
  );
};
