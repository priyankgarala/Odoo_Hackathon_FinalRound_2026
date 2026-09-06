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
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as soApi from "../api/sales-orders.api";
import { getContacts } from "../api/contacts.api";
import { getProducts } from "../api/products.api";

type Row = {
  productId: string;
  quantity: number;
  unitPrice: string;
  taxId: string;
  taxRate: number;
};

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

const formatMoney = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);

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
      pt: 3,
      pb: 6,
    }}
  >
    {title && (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            color: COLORS.text,
            fontWeight: 700,
            fontSize: { xs: "1.7rem", md: "2rem" },
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            color: COLORS.muted,
            mt: 0.5,
            fontSize: "0.85rem",
          }}
        >
          Create and manage customer sales orders
        </Typography>

        <Box
          sx={{
            width: 32,
            height: 2,
            bgcolor: COLORS.accent,
            mt: 1,
            borderRadius: 2,
          }}
        />
      </Box>
    )}

    <Box
      sx={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        p: { xs: 2, md: 3 },
        bgcolor: COLORS.card,
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
      }}
    >
      {children}
    </Box>
  </Box>
);

/* ========================================================= */
/* TEXT FIELD                                                 */
/* ========================================================= */

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

  "& .MuiSvgIcon-root": {
    color: COLORS.muted,
  },

  "& input[type=date]::-webkit-calendar-picker-indicator": {
    filter: "invert(0.7)",
  },
};

/* ========================================================= */
/* WHITE DROPDOWN                                            */
/* ========================================================= */

const darkSelectProps = {
  MenuProps: {
    PaperProps: {
      sx: {
        bgcolor: "#ffffff",
        color: COLORS.text,
        maxHeight: 300,

        border: `1px solid ${COLORS.border}`,

        borderRadius: 2,

        boxShadow:
          "0 12px 30px rgba(15, 23, 42, 0.12)",

        "& .MuiMenuItem-root": {
          fontSize: "0.85rem",
          color: COLORS.text,
          bgcolor: "#ffffff",
          minHeight: 40,
          transition: "background-color 0.15s ease",
        },

        "& .MuiMenuItem-root:hover": {
          bgcolor: COLORS.accentSoft,
          color: COLORS.accent,
        },

        "& .MuiMenuItem-root.Mui-selected": {
          bgcolor: COLORS.accentSoft,
          color: COLORS.accent,
          fontWeight: 600,
        },

        "& .MuiMenuItem-root.Mui-selected:hover": {
          bgcolor: "#dbeafe",
        },
      },
    },
  },
};

/* ========================================================= */
/* BUTTON                                                     */
/* ========================================================= */

const CustomButton = ({
  children,
  active,
  ...props
}: any) => (
  <Button
    variant={active ? "contained" : "outlined"}
    sx={{
      color: active ? "#071414" : COLORS.muted,
      bgcolor: active ? COLORS.accent : "transparent",

      borderColor: active
        ? COLORS.accent
        : COLORS.borderStrong,

      borderRadius: 2,
      textTransform: "none",
      minWidth: 90,
      px: 2.5,
      fontWeight: 600,
      boxShadow: "none",

      "&:hover": {
        bgcolor: active
          ? COLORS.accentHover
          : COLORS.accentSoft,

        borderColor: active
          ? COLORS.accentHover
          : COLORS.accent,

        color: active
          ? "#071414"
          : COLORS.text,

        boxShadow: "none",
      },

      "&:disabled": {
        color: COLORS.muted,
        borderColor: COLORS.border,
      },
    }}
    {...props}
  >
    {children}
  </Button>
);

/* ========================================================= */
/* PAGE                                                        */
/* ========================================================= */

export const CreateSalesOrderPage = () => {
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState("");

  const [soDate, setSoDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [soNo, setSoNo] = useState(
    `SO${Math.floor(1000 + Math.random() * 9000)}`
  );

  const [notes, setNotes] = useState("");

  const [rows, setRows] = useState<Row[]>([
    {
      productId: "",
      quantity: 1,
      unitPrice: "",
      taxId: "",
      taxRate: 0,
    },
  ]);

  const [validationError, setValidationError] =
    useState<string | null>(null);

  /* ========================================================= */
  /* CUSTOMERS                                                  */
  /* ========================================================= */

  const customers = useQuery({
    queryKey: ["so-customers"],
    queryFn: () =>
      getContacts({
        active: "true",
        page: 1,
        pageSize: 100,
      }),
  });

  const customerList = (
    customers.data?.data ?? []
  ).filter(
    (c) =>
      c.type === "CUSTOMER" ||
      c.type === "BOTH"
  );

  /* ========================================================= */
  /* PRODUCTS                                                   */
  /* ========================================================= */

  const products = useQuery({
    queryKey: ["so-products"],
    queryFn: () =>
      getProducts({
        active: "true",
        page: 1,
        pageSize: 100,
      }),
  });

  /* ========================================================= */
  /* TAXES                                                      */
  /* ========================================================= */

  const taxes = useQuery({
    queryKey: ["so-taxes"],
    queryFn: () =>
      import("../api/taxes.api").then((m) =>
        m.getTaxes({ pageSize: 100 })
      ),
  });

  /* ========================================================= */
  /* SAVE                                                        */
  /* ========================================================= */

  const save = useMutation({
    mutationFn: () =>
      soApi.createSalesOrder({
        customerId: Number(customerId),

        notes: notes.trim() || undefined,
        items: rows.map((r) => ({
          productId: Number(r.productId),

          quantity: Number(r.quantity),

          unitPrice:
            r.unitPrice !== "" &&
            !isNaN(Number(r.unitPrice))
              ? Number(r.unitPrice)
              : undefined,

          taxId: r.taxId
            ? Number(r.taxId)
            : null,

          taxRate: Number(r.taxRate) || 0,
        })),
      }),

    onSuccess: (o) =>
      navigate(`/sales-orders/${o.id}`),
  });

  /* ========================================================= */
  /* UPDATE ROW                                                  */
  /* ========================================================= */

  const update = (
    i: number,
    p: Partial<Row>
  ) => {
    setRows(
      rows.map((r, n) =>
        n === i
          ? { ...r, ...p }
          : r
      )
    );
  };

  /* ========================================================= */
  /* CONFIRM                                                     */
  /* ========================================================= */

  const handleConfirm = () => {
    setValidationError(null);

    if (!customerId) {
      setValidationError(
        "Please select a customer."
      );
      return;
    }

    if (rows.length === 0) {
      setValidationError(
        "Please add at least one line item."
      );
      return;
    }

    const invalidRow = rows.find(
      (r) =>
        !r.productId ||
        Number(r.quantity) <= 0
    );

    if (invalidRow) {
      setValidationError(
        "Please select a product and valid quantity (> 0) for all lines."
      );
      return;
    }

    save.mutate();
  };

  /* ========================================================= */
  /* TOTAL                                                       */
  /* ========================================================= */

  const total = rows.reduce((sum, r) => {
    const product =
      products.data?.data.find(
        (x) =>
          x.id === Number(r.productId)
      );

    const price =
      Number(r.unitPrice) ||
      Number(product?.unitPrice) ||
      0;

    const tax =
      Number(r.taxRate) || 0;

    return (
      sum +
      price *
        Number(r.quantity) *
        (1 + tax / 100)
    );
  }, 0);

  /* ========================================================= */
  /* ERROR                                                       */
  /* ========================================================= */

  const serverError = axios.isAxiosError(
    save.error
  )
    ? (save.error.response?.data as any)
        ?.error ??
      "Could not create sales order."
    : save.error
    ? "Could not create sales order."
    : null;

  return (
    <DarkContainer title="Sales Order">
      <Stack spacing={3.5}>

        {/* ================= HEADER ================= */}

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            sm: "center",
          }}
          spacing={2}
        >
          <Stack
            direction="row"
            spacing={1.5}
          >
            <CustomButton
              active
              disabled={save.isPending}
              onClick={handleConfirm}
            >
              {save.isPending
                ? "Confirming..."
                : "Confirm"}
            </CustomButton>
          </Stack>

          <CustomButton
            onClick={() =>
              navigate("/sales-orders")
            }
          >
            Cancel
          </CustomButton>
        </Stack>

        {/* ================= ALERTS ================= */}

        {validationError && (
          <Alert
            severity="warning"
            sx={{
              bgcolor: COLORS.warningSoft,
              color: COLORS.warning,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2,

              "& .MuiAlert-icon": {
                color: COLORS.warning,
              },
            }}
          >
            {validationError}
          </Alert>
        )}

        {serverError && (
          <Alert
            severity="error"
            sx={{
              bgcolor: COLORS.dangerSoft,
              color: COLORS.danger,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2,

              "& .MuiAlert-icon": {
                color: COLORS.danger,
              },
            }}
          >
            {serverError}
          </Alert>
        )}

        {/* ================= ORDER INFO ================= */}

        <Box
          sx={{
            p: 2.5,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 2.5,
            bgcolor:
              "rgba(255,255,255,0.015)",
          }}
        >
          <Typography
            sx={{
              color: COLORS.text,
              fontWeight: 700,
              fontSize: "0.9rem",
              mb: 2,
            }}
          >
            Order Information
          </Typography>

          <Stack spacing={2}>

            {/* SO NUMBER */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
              spacing={2}
            >
              <Typography
                sx={{
                  color: COLORS.muted,
                  minWidth: 140,
                  fontSize: "0.85rem",
                }}
              >
                SO No.
              </Typography>

              <Typography
                sx={{
                  color: COLORS.accent,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                {soNo}
              </Typography>
            </Stack>

            {/* CUSTOMER */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              spacing={2}
            >
              <Typography
                sx={{
                  color: COLORS.muted,
                  minWidth: 140,
                  fontSize: "0.85rem",
                }}
              >
                Customer Name
              </Typography>

              <TextField
                select
                SelectProps={darkSelectProps}
                variant="standard"
                fullWidth
                value={customerId}
                onChange={(e) => {
                  setCustomerId(
                    e.target.value
                  );

                  setValidationError(null);
                }}
                sx={darkTextFieldSx}
              >
                <MenuItem
                  value=""
                  disabled
                >
                  Select Customer
                </MenuItem>

                {customerList.map((c) => (
                  <MenuItem
                    key={c.id}
                    value={String(c.id)}
                  >
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* DATE */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              spacing={2}
            >
              <Typography
                sx={{
                  color: COLORS.muted,
                  minWidth: 140,
                  fontSize: "0.85rem",
                }}
              >
                Order Date
              </Typography>

              <TextField
                type="date"
                variant="standard"
                fullWidth
                value={soDate}
                onChange={(e) =>
                  setSoDate(e.target.value)
                }
                sx={darkTextFieldSx}
              />
            </Stack>
          </Stack>
        </Box>

        {/* ================= LINE ITEMS ================= */}

        <Box>
          <Typography
            sx={{
              color: COLORS.text,
              fontWeight: 700,
              fontSize: "0.9rem",
              mb: 1.5,
            }}
          >
            Order Items
          </Typography>

          <TableContainer
            sx={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2.5,
              overflow: "auto",
            }}
          >
            <Table
              size="small"
              sx={{
                minWidth: 800,
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor:
                      "rgba(255,255,255,0.035)",
                  }}
                >
                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                      width: 45,
                    }}
                  >
                    Sr.
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Product
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                      width: 90,
                    }}
                  >
                    Qty
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                      width: 130,
                    }}
                  >
                    Unit Price
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                      width: 150,
                    }}
                  >
                    Tax
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                      width: 130,
                    }}
                  >
                    Total
                  </TableCell>

                  <TableCell
                    sx={{
                      borderBottom: `1px solid ${COLORS.border}`,
                      width: 45,
                    }}
                  />
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r, i) => {
                  const prod =
                    products.data?.data.find(
                      (x) =>
                        x.id ===
                        Number(r.productId)
                    );

                  const price =
                    r.unitPrice !== ""
                      ? Number(r.unitPrice)
                      : Number(
                          prod?.unitPrice || 0
                        );

                  const tax =
                    Number(r.taxRate) || 0;

                  const lineTotal =
                    price *
                    (Number(r.quantity) || 0) *
                    (1 + tax / 100);

                  return (
                    <TableRow
                      key={i}
                      sx={{
                        "&:hover": {
                          bgcolor:
                            "rgba(255,255,255,0.02)",
                        },
                      }}
                    >

                      {/* SERIAL */}

                      <TableCell
                        sx={{
                          color: COLORS.muted,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {i + 1}.
                      </TableCell>

                      {/* PRODUCT */}

                      <TableCell
                        sx={{
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        <TextField
                          select
                          SelectProps={
                            darkSelectProps
                          }
                          variant="standard"
                          fullWidth
                          value={r.productId}
                          onChange={(e) => {
                            const p =
                              products.data?.data.find(
                                (x) =>
                                  x.id ===
                                  Number(
                                    e.target.value
                                  )
                              );

                            const autoPrice =
                              p
                                ? String(
                                    p.unitPrice ||
                                      0
                                  )
                                : "";

                            const autoTax =
                              p?.defaultTax ??
                              p?.productCategory
                                ?.tax ??
                              null;

                            const autoTaxId =
                              autoTax
                                ? String(
                                    autoTax.id
                                  )
                                : p?.defaultTaxId
                                ? String(
                                    p.defaultTaxId
                                  )
                                : "";

                            const autoTaxRate =
                              autoTax
                                ? Number(
                                    autoTax.rate
                                  )
                                : 0;

                            update(i, {
                              productId:
                                e.target.value,
                              unitPrice:
                                autoPrice,
                              taxId:
                                autoTaxId,
                              taxRate:
                                autoTaxRate,
                            });

                            setValidationError(
                              null
                            );
                          }}
                          sx={darkTextFieldSx}
                        >
                          <MenuItem
                            value=""
                            disabled
                          >
                            Select Product
                          </MenuItem>

                          {products.data?.data.map(
                            (p) => (
                              <MenuItem
                                key={p.id}
                                value={String(
                                  p.id
                                )}
                              >
                                {p.name}
                              </MenuItem>
                            )
                          )}
                        </TextField>
                      </TableCell>

                      {/* QUANTITY */}

                      <TableCell
                        align="right"
                        sx={{
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        <TextField
                          type="number"
                          variant="standard"
                          value={r.quantity}
                          onChange={(e) => {
                            update(i, {
                              quantity: Math.max(
                                1,
                                Number(
                                  e.target.value
                                ) || 1
                              ),
                            });

                            setValidationError(
                              null
                            );
                          }}
                          sx={darkTextFieldSx}
                          inputProps={{
                            min: 1,
                            style: {
                              textAlign: "right",
                            },
                          }}
                        />
                      </TableCell>

                      {/* UNIT PRICE */}

                      <TableCell
                        align="right"
                        sx={{
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        <TextField
                          type="number"
                          variant="standard"
                          value={r.unitPrice}
                          placeholder="Price"
                          onChange={(e) =>
                            update(i, {
                              unitPrice:
                                e.target.value,
                            })
                          }
                          sx={darkTextFieldSx}
                          inputProps={{
                            style: {
                              textAlign: "right",
                            },
                          }}
                        />
                      </TableCell>

                      {/* TAX */}

                      <TableCell
                        align="right"
                        sx={{
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent:
                              "flex-end",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              px: 1.2,
                              py: 0.45,
                              borderRadius: 1.5,
                              bgcolor:
                                r.taxRate > 0
                                  ? COLORS.accentSoft
                                  : "#f8fafc",

                              border: `1px solid ${
                                r.taxRate > 0
                                  ? "rgba(37,99,235,0.25)"
                                  : COLORS.border
                              }`,
                            }}
                          >
                            <Typography
                              sx={{
                                color:
                                  r.taxRate > 0
                                    ? COLORS.accent
                                    : COLORS.muted,
                                fontSize:
                                  "0.8rem",
                                fontWeight: 700,
                              }}
                            >
                              {r.taxRate}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* TOTAL */}

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                          fontWeight: 700,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(
                          lineTotal
                        )}
                      </TableCell>

                      {/* DELETE */}

                      <TableCell
                        sx={{
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        <IconButton
                          size="small"
                          disabled={
                            rows.length === 1
                          }
                          onClick={() =>
                            setRows(
                              rows.filter(
                                (_, n) =>
                                  n !== i
                              )
                            )
                          }
                          sx={{
                            color: COLORS.muted,

                            "&:hover": {
                              color: COLORS.danger,
                              bgcolor:
                                COLORS.dangerSoft,
                            },
                          }}
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
        </Box>

        {/* ================= FOOTER ================= */}

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            sm: "center",
          }}
          spacing={2}
        >
          <Button
            startIcon={<AddIcon />}
            onClick={() =>
              setRows([
                ...rows,
                {
                  productId: "",
                  quantity: 1,
                  unitPrice: "",
                  taxId: "",
                  taxRate: 0,
                },
              ])
            }
            sx={{
              color: COLORS.accent,
              borderColor:
                "rgba(37,99,235,0.35)",
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,

              "&:hover": {
                bgcolor: COLORS.accentSoft,
                borderColor: COLORS.accent,
              },
            }}
            variant="outlined"
          >
            Add Line
          </Button>

          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderRadius: 2.5,
              bgcolor:
                "rgba(255,255,255,0.025)",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <Typography
                sx={{
                  color: COLORS.muted,
                  fontSize: "0.85rem",
                }}
              >
                Order Total
              </Typography>

              <Typography
                sx={{
                  color: COLORS.accent,
                  fontSize: "1.2rem",
                  fontWeight: 800,
                }}
              >
                {formatMoney(total)}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* ================= TAX INFO ================= */}

        <Box
          sx={{
            p: 1.8,
            borderRadius: 2,
            bgcolor: COLORS.accentSoft,
            border: `1px solid rgba(37,99,235,0.18)`,
          }}
        >
          <Typography
            sx={{
              color: COLORS.accent,
              fontSize: "0.78rem",
              fontWeight: 600,
            }}
          >
            Tax is automatically applied based on the
            selected product's material category.
          </Typography>
        </Box>

      </Stack>
    </DarkContainer>
  );
};