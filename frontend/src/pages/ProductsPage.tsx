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
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as productsApi from "../api/products.api";
import * as taxesApi from "../api/taxes.api";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";
import { isSystemAdministrator } from "../features/auth/roles";

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
  info: "#0284c7",
  infoSoft: "#e0f2fe",
};

const blank: productsApi.ProductInput = {
  name: "",
  type: "GOODS",
  unitPrice: 0,
  costPrice: 0,
  category: "",
  description: "",
  image: null,
};

const apiError = (error: unknown) =>
  axios.isAxiosError<{ error?: string }>(error)
    ? error.response?.data?.error ?? "Request failed."
    : "Request failed.";

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
      pb: 6,
    }}
  >
    {title && (
      <Box
        sx={{
          bgcolor: COLORS.accentSoft,
          border: `1px solid ${COLORS.accent}`,
          borderRadius: 2,
          py: 1,
          px: 3,
          mb: 3,
          display: "inline-block",
        }}
      >
        <Typography
          variant="h6"
          color={COLORS.accent}
          fontWeight={700}
        >
          {title}
        </Typography>
      </Box>
    )}

    <Box
      sx={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        p: { xs: 2, md: 3 },
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

const darkSelectProps = {
  MenuProps: {
    PaperProps: {
      sx: {
        bgcolor: COLORS.card,
        color: COLORS.text,
        maxHeight: 300,
        border: `1px solid ${COLORS.borderStrong}`,
        "& .MuiMenuItem-root:hover": {
          bgcolor: COLORS.cardHover,
        },
        "& .Mui-selected": {
          bgcolor: `${COLORS.accentSoft} !important`,
          color: COLORS.accent,
        },
      },
    },
  },
};

const CustomButton = ({
  children,
  active,
  ...props
}: any) => (
  <Button
    variant={active ? "contained" : "outlined"}
    sx={{
      color: active ? "#071313" : COLORS.text,
      bgcolor: active ? COLORS.accent : "transparent",
      borderColor: active
        ? COLORS.accent
        : COLORS.borderStrong,
      borderRadius: 2,
      textTransform: "none",
      minWidth: 80,
      fontWeight: 600,
      "&:hover": {
        bgcolor: active
          ? COLORS.accentHover
          : COLORS.accentSoft,
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

const formatMoney = (amount: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export const ProductsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = isSystemAdministrator(user?.role);

  const [screen, setScreen] = useState<"list" | "form">("list");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] =
    useState<productsApi.ProductInput>(blank);
  const [editing, setEditing] =
    useState<productsApi.Product | null>(null);
  const [validationError, setValidationError] =
    useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      page,
      pageSize: 12,
    }),
    [search, page]
  );

  const products = useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.getProducts(params),
  });

  const taxesQuery = useQuery({
    queryKey: ["taxes"],
    queryFn: () => taxesApi.getTaxes({ pageSize: 100 }),
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["products"],
    });

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) =>
      ids.length === 1
        ? productsApi.deleteProduct(ids[0])
        : productsApi.deleteProductsBulk(ids),
    onSuccess: () => {
      setSelectedIds([]);
      refresh();
    },
  });

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected product(s)?`
      )
    ) {
      deleteMutation.mutate(selectedIds);
    }
  };

  const renderedProducts = products.data?.data ?? [];

  const isAllSelected =
    renderedProducts.length > 0 &&
    selectedIds.length === renderedProducts.length;

  const isSomeSelected =
    selectedIds.length > 0 &&
    selectedIds.length < renderedProducts.length;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(
        renderedProducts.map((product) => product.id)
      );
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const save = useMutation({
    mutationFn: (
      payload: productsApi.ProductInput
    ) =>
      editing
        ? productsApi.updateProduct({
            id: editing.id,
            input: payload,
          })
        : productsApi.createProduct(payload),

    onSuccess: () => {
      setScreen("list");
      setEditing(null);
      setForm(blank);
      refresh();
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setValidationError(null);
    setScreen("form");
  };

  const openRecord = (
    prod: productsApi.Product
  ) => {
    setEditing(prod);

    setForm({
      sku: prod.sku,
      name: prod.name,
      type: prod.type || "GOODS",
      unitPrice: Number(prod.unitPrice),
      costPrice: Number(prod.costPrice) || 0,
      defaultTaxId: prod.defaultTaxId ?? null,
      category: prod.category || "",
      description: prod.description || "",
      image: prod.image,
    });

    setValidationError(null);
    setScreen("form");
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          image: reader.result as string,
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!form.name || form.name.trim().length < 2) {
      setValidationError(
        "Product Name must be at least 2 characters long."
      );
      return;
    }

    if (form.unitPrice < 0) {
      setValidationError(
        "Sales Price cannot be negative."
      );
      return;
    }

    if ((form.costPrice ?? 0) < 0) {
      setValidationError(
        "Cost cannot be negative."
      );
      return;
    }

    setValidationError(null);
    save.mutate(form);
  };

  /* =========================
     FORM VIEW
  ========================= */

  if (screen === "form") {
    return (
      <DarkContainer>
        <Stack
          component="form"
          onSubmit={submit}
          spacing={4}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={2}>
              <CustomButton
                type="submit"
                disabled={save.isPending || !canManage}
                active
              >
                {save.isPending ? "Saving..." : "Confirm"}
              </CustomButton>
            </Stack>

            <CustomButton
              type="button"
              onClick={() => {
                setScreen("list");
                setEditing(null);
              }}
            >
              Back
            </CustomButton>
          </Stack>

          {!canManage && (
            <Alert
              severity="info"
              sx={{
                bgcolor: COLORS.infoSoft,
                color: COLORS.info,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              You have view-only access to product
              management.
            </Alert>
          )}

          {validationError && (
            <Alert
              severity="warning"
              sx={{
                bgcolor: COLORS.warningSoft,
                color: COLORS.warning,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              {validationError}
            </Alert>
          )}

          {save.isError && (
            <Alert
              severity="error"
              sx={{
                bgcolor: COLORS.dangerSoft,
                color: COLORS.danger,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              {apiError(save.error)}
            </Alert>
          )}

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={6}
          >
            <Stack spacing={3} flex={1}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  color={COLORS.text}
                  minWidth={140}
                >
                  Product Name
                </Typography>

                <TextField
                  variant="standard"
                  fullWidth
                  placeholder="e.g. Office Chair"
                  value={form.name}
                  disabled={!canManage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  required
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  color={COLORS.text}
                  minWidth={140}
                >
                  Product Type
                </Typography>

                <TextField
                  select
                  SelectProps={darkSelectProps}
                  variant="standard"
                  fullWidth
                  value={form.type}
                  disabled={!canManage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target
                        .value as productsApi.ProductType,
                    })
                  }
                  sx={darkTextFieldSx}
                >
                  <MenuItem value="GOODS">
                    Goods
                  </MenuItem>
                  <MenuItem value="SERVICE">
                    Service
                  </MenuItem>
                  <MenuItem value="COMBO">
                    Combo
                  </MenuItem>
                </TextField>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  color={COLORS.text}
                  minWidth={140}
                >
                  Category
                </Typography>

                <TextField
                  variant="standard"
                  fullWidth
                  placeholder="e.g. Electronics, Furniture"
                  value={form.category ?? ""}
                  disabled={!canManage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  color={COLORS.text}
                  minWidth={140}
                >
                  Sales Price (Rs.)
                </Typography>

                <TextField
                  variant="standard"
                  type="number"
                  fullWidth
                  value={form.unitPrice}
                  disabled={!canManage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unitPrice: Number(
                        e.target.value
                      ),
                    })
                  }
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  color={COLORS.text}
                  minWidth={140}
                >
                  Cost (Rs.)
                </Typography>

                <TextField
                  variant="standard"
                  type="number"
                  fullWidth
                  value={form.costPrice}
                  disabled={!canManage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      costPrice: Number(
                        e.target.value
                      ),
                    })
                  }
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  color={COLORS.text}
                  minWidth={140}
                >
                  Default Tax
                </Typography>

                <TextField
                  select
                  SelectProps={darkSelectProps}
                  variant="standard"
                  fullWidth
                  value={
                    form.defaultTaxId
                      ? String(form.defaultTaxId)
                      : ""
                  }
                  disabled={!canManage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultTaxId: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  sx={darkTextFieldSx}
                >
                  <MenuItem value="">
                    No Tax (0%)
                  </MenuItem>

                  {taxesQuery.data?.data.map(
                    (tax) => (
                      <MenuItem
                        key={tax.id}
                        value={String(tax.id)}
                      >
                        {tax.name} (
                        {parseFloat(tax.rate)}
                        %)
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Stack>

              <Stack
                direction="row"
                alignItems="flex-start"
                spacing={2}
              >
                <Typography
                  color={COLORS.text}
                  minWidth={140}
                  pt={1}
                >
                  Description
                </Typography>

                <TextField
                  variant="standard"
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.description ?? ""}
                  disabled={!canManage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  sx={darkTextFieldSx}
                />
              </Stack>
            </Stack>

            <Box
              component="label"
              sx={{
                width: 200,
                height: 200,
                flexShrink: 0,
                border: `1px dashed ${COLORS.borderStrong}`,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canManage
                  ? "pointer"
                  : "default",
                overflow: "hidden",
                bgcolor: COLORS.page,
                "&:hover": {
                  borderColor: canManage
                    ? COLORS.accent
                    : COLORS.borderStrong,
                },
              }}
            >
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={!canManage}
                onChange={handleImageUpload}
              />

              {form.image ? (
                <Box
                  component="img"
                  src={form.image}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Stack
                  alignItems="center"
                  spacing={1}
                >
                  <Inventory2OutlinedIcon
                    sx={{
                      fontSize: 40,
                      color: COLORS.muted,
                    }}
                  />

                  <Typography
                    color={COLORS.muted}
                  >
                    Upload Image
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  /* =========================
     LIST VIEW
  ========================= */

  return (
    <DarkContainer title="Products">
      <Stack spacing={4}>
        {/* Top Actions */}
        <Stack
          direction={{
            xs: "column",
            lg: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            lg: "center",
          }}
          spacing={2}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            {canManage && (
              <CustomButton
                onClick={openCreate}
                active
              >
                New
              </CustomButton>
            )}

            {selectedIds.length > 0 &&
              canManage && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDeleteSelected}
                  disabled={deleteMutation.isPending}
                  sx={{
                    color: COLORS.danger,
                    borderColor:
                      "rgba(233,139,139,0.5)",
                    bgcolor:
                      COLORS.dangerSoft,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor:
                        "rgba(233,139,139,0.18)",
                      borderColor:
                        COLORS.danger,
                    },
                  }}
                >
                  Delete ({selectedIds.length})
                </Button>
              )}
          </Stack>

          <TextField
            variant="outlined"
            size="small"
            placeholder="Search products..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            sx={{
              width: {
                xs: "100%",
                lg: 300,
              },
              input: {
                color: COLORS.text,
              },
              "& .MuiOutlinedInput-root": {
                bgcolor: COLORS.page,
                borderRadius: 2,
                "& fieldset": {
                  borderColor: COLORS.borderStrong,
                },
                "&:hover fieldset": {
                  borderColor: COLORS.accent,
                },
                "&.Mui-focused fieldset": {
                  borderColor: COLORS.accent,
                },
              },
            }}
          />

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="flex-end"
          >
            <CustomButton
              onClick={() => setScreen("list")}
            >
              Back
            </CustomButton>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, next) =>
                next && setView(next)
              }
              sx={{
                bgcolor: COLORS.page,
                border: `1px solid ${COLORS.borderStrong}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <ToggleButton
                value="list"
                sx={{
                  color: COLORS.muted,
                  border: "none",
                  "&.Mui-selected": {
                    bgcolor: COLORS.accentSoft,
                    color: COLORS.accent,
                  },
                  "&:hover": {
                    bgcolor: COLORS.accentSoft,
                  },
                }}
              >
                <ViewListIcon />
              </ToggleButton>

              <ToggleButton
                value="kanban"
                sx={{
                  color: COLORS.muted,
                  border: "none",
                  "&.Mui-selected": {
                    bgcolor: COLORS.accentSoft,
                    color: COLORS.accent,
                  },
                  "&:hover": {
                    bgcolor: COLORS.accentSoft,
                  },
                }}
              >
                <ViewModuleIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {/* Delete Error */}
        {deleteMutation.isError && (
          <Alert
            severity="error"
            sx={{
              bgcolor: COLORS.dangerSoft,
              color: COLORS.danger,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {apiError(deleteMutation.error)}
          </Alert>
        )}

        {/* Content */}
        {products.isLoading ? (
          <LoadingState label="Loading products..." />
        ) : products.isError ? (
          <ErrorState
            message={apiError(products.error)}
            onRetry={() =>
              void products.refetch()
            }
          />
        ) : renderedProducts.length === 0 ? (
          <EmptyState message="No products found. Click 'New' to create one." />
        ) : view === "list" ? (
          /* =========================
             TABLE VIEW
          ========================= */
          <TableContainer
            sx={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              bgcolor: COLORS.page,
              overflow: "hidden",
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: COLORS.cardHover,
                  }}
                >
                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={(e) =>
                        toggleSelectAll(
                          e.target.checked
                        )
                      }
                      sx={{
                        color: COLORS.muted,
                        "&.Mui-checked": {
                          color: COLORS.accent,
                        },
                        "&.MuiCheckbox-indeterminate": {
                          color: COLORS.accent,
                        },
                      }}
                    />
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Product
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Category
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Type
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Sales Price
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Cost
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {renderedProducts.map((prod) => (
                  <TableRow
                    key={prod.id}
                    hover
                    onClick={() =>
                      openRecord(prod)
                    }
                    sx={{
                      cursor: "pointer",
                      bgcolor: COLORS.page,
                      "&:hover": {
                        bgcolor:
                          COLORS.cardHover,
                      },
                    }}
                  >
                    <TableCell
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      sx={{
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(
                          prod.id
                        )}
                        onChange={() =>
                          toggleSelectRow(
                            prod.id
                          )
                        }
                        sx={{
                          color: COLORS.muted,
                          "&.Mui-checked": {
                            color: COLORS.accent,
                          },
                        }}
                      />
                    </TableCell>

                    <TableCell
                      sx={{
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                      >
                        {prod.image ? (
                          <Box
                            component="img"
                            src={prod.image}
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: 1.5,
                              objectFit: "cover",
                              border: `1px solid ${COLORS.border}`,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: 1.5,
                              bgcolor:
                                COLORS.accentSoft,
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                            }}
                          >
                            <Inventory2OutlinedIcon
                              sx={{
                                color:
                                  COLORS.accent,
                                fontSize: 22,
                              }}
                            />
                          </Box>
                        )}

                        <Typography
                          color={COLORS.text}
                          fontWeight={600}
                        >
                          {prod.name}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.text,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {prod.category || "—"}
                    </TableCell>

                    <TableCell
                      sx={{
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <Chip
                        size="small"
                        label={
                          prod.type || "GOODS"
                        }
                        sx={{
                          bgcolor:
                            COLORS.accentSoft,
                          color:
                            COLORS.accent,
                          border: `1px solid rgba(77,182,172,0.25)`,
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.text,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {formatMoney(
                        prod.unitPrice
                      )}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.muted,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {formatMoney(
                        prod.costPrice
                      )}
                    </TableCell>

                    <TableCell
                      align="right"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      sx={{
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {canManage && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete ${prod.name}?`
                              )
                            ) {
                              deleteMutation.mutate([
                                prod.id,
                              ]);
                            }
                          }}
                          sx={{
                            color: COLORS.danger,
                            borderColor:
                              "rgba(233,139,139,0.45)",
                            bgcolor:
                              COLORS.dangerSoft,
                            borderRadius: 1.5,
                            textTransform:
                              "none",
                            fontSize:
                              "0.8rem",
                            fontWeight: 600,
                            "&:hover": {
                              bgcolor:
                                "rgba(233,139,139,0.18)",
                              borderColor:
                                COLORS.danger,
                            },
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* =========================
             KANBAN VIEW
          ========================= */
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 3,
            }}
          >
            {renderedProducts.map((prod) => (
              <Paper
                key={prod.id}
                variant="outlined"
                onClick={() =>
                  openRecord(prod)
                }
                sx={{
                  p: 2.5,
                  cursor: "pointer",
                  bgcolor: COLORS.page,
                  borderColor: COLORS.border,
                  borderRadius: 3,
                  transition:
                    "all 0.2s ease",
                  "&:hover": {
                    borderColor:
                      COLORS.accent,
                    bgcolor:
                      COLORS.cardHover,
                    transform:
                      "translateY(-2px)",
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor:
                          COLORS.accentSoft,
                        borderRadius: 2,
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        overflow: "hidden",
                        flexShrink: 0,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {prod.image ? (
                        <Box
                          component="img"
                          src={prod.image}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Inventory2OutlinedIcon
                          sx={{
                            fontSize: 36,
                            color:
                              COLORS.accent,
                          }}
                        />
                      )}
                    </Box>

                    <Stack
                      spacing={0.5}
                      overflow="hidden"
                    >
                      <Typography
                        color={COLORS.text}
                        fontWeight={700}
                        noWrap
                      >
                        {prod.name}
                      </Typography>

                      <Typography
                        color={COLORS.muted}
                        variant="body2"
                        noWrap
                      >
                        {prod.category ||
                          "Uncategorized"}
                      </Typography>

                      <Typography
                        color={COLORS.text}
                        variant="body2"
                      >
                        Sales Price:{" "}
                        <Box
                          component="span"
                          sx={{
                            color:
                              COLORS.accent,
                            fontWeight: 600,
                          }}
                        >
                          {formatMoney(
                            prod.unitPrice
                          )}
                        </Box>
                      </Typography>

                      <Typography
                        color={COLORS.muted}
                        variant="body2"
                      >
                        Cost:{" "}
                        {formatMoney(
                          prod.costPrice
                        )}
                      </Typography>
                    </Stack>
                  </Stack>

                  {canManage && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();

                        if (
                          window.confirm(
                            `Delete ${prod.name}?`
                          )
                        ) {
                          deleteMutation.mutate([
                            prod.id,
                          ]);
                        }
                      }}
                      sx={{
                        color: COLORS.danger,
                        borderColor:
                          "rgba(233,139,139,0.45)",
                        bgcolor:
                          COLORS.dangerSoft,
                        borderRadius: 1.5,
                        textTransform:
                          "none",
                        minWidth: "auto",
                        px: 1.5,
                        "&:hover": {
                          bgcolor:
                            "rgba(233,139,139,0.18)",
                          borderColor:
                            COLORS.danger,
                        },
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
              </Paper>
            ))}
          </Box>
        )}

        {/* Pagination */}
        <Box
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            pt: 1,
          }}
        >
          <Typography
            variant="body2"
            color={COLORS.muted}
          >
            {products.data?.meta.total ?? 0}{" "}
            products
          </Typography>

          <Pagination
            page={page}
            count={Math.max(
              1,
              products.data?.meta.totalPages ??
                1
            )}
            onChange={(_, value) =>
              setPage(value)
            }
            sx={{
              "& .MuiPaginationItem-root": {
                color: COLORS.muted,
              },
              "& .MuiPaginationItem-root:hover": {
                bgcolor: COLORS.accentSoft,
              },
              "& .MuiPaginationItem-root.Mui-selected":
                {
                  bgcolor: COLORS.accent,
                  color: "#071313",
                  fontWeight: 700,
                },
            }}
          />
        </Box>
      </Stack>
    </DarkContainer>
  );
};