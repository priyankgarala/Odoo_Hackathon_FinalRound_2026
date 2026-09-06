import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
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
import { useQuery } from "@tanstack/react-query";
import * as invoicesApi from "../api/invoices.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";

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

const money = (value: string | number) =>
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
      pt: 5,
      pb: 5,
    }}
  >
    {title && (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 2.5,
          py: 1.25,
          mb: 3.5,
          bgcolor: COLORS.accentSoft,
          border: `1px solid ${COLORS.borderStrong}`,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: COLORS.accent,
            fontWeight: 600,
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
        borderRadius: 3,
        p: { xs: 2, sm: 3.5 },
        bgcolor: COLORS.card,
      }}
    >
      {children}
    </Box>
  </Box>
);

export const InvoicesPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const invoices = useQuery({
    queryKey: ["invoices", search, status, page],
    queryFn: () =>
      invoicesApi.getInvoices({
        search: search || undefined,
        status: status || undefined,
        page,
        pageSize: 20,
      }),
  });

  return (
    <DarkContainer title="Customer Invoices & Receipts">
      <Stack spacing={4}>
        {/* Page Description */}
        <Box>
          <Typography
            variant="body1"
            sx={{
              color: COLORS.muted,
              lineHeight: 1.7,
            }}
          >
            Sales order → Customer invoice → Receive payment
            → Automated journal entry
          </Typography>
        </Box>

        {/* Search & Filter */}
        <Box
          sx={{
            bgcolor: COLORS.cardHover,
            p: 2.5,
            borderRadius: 2.5,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
          >
            <TextField
              size="small"
              placeholder="Search invoice number or customer name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: COLORS.text,

                  "& fieldset": {
                    borderColor:
                      COLORS.borderStrong,
                  },

                  "&:hover fieldset": {
                    borderColor:
                      COLORS.accent,
                  },

                  "&.Mui-focused fieldset": {
                    borderColor:
                      COLORS.accent,
                  },
                },

                "& .MuiInputBase-input::placeholder": {
                  color: COLORS.muted,
                  opacity: 1,
                },
              }}
            />

            <FormControl
              size="small"
              sx={{
                minWidth: 170,

                "& .MuiInputLabel-root": {
                  color: COLORS.muted,
                },

                "& .MuiInputLabel-root.Mui-focused": {
                  color: COLORS.accent,
                },

                "& .MuiOutlinedInput-root": {
                  color: COLORS.text,

                  "& fieldset": {
                    borderColor:
                      COLORS.borderStrong,
                  },

                  "&:hover fieldset": {
                    borderColor:
                      COLORS.accent,
                  },

                  "&.Mui-focused fieldset": {
                    borderColor:
                      COLORS.accent,
                  },
                },

                "& .MuiSvgIcon-root": {
                  color: COLORS.muted,
                },
              }}
            >
              <InputLabel>
                Status
              </InputLabel>

              <Select
                label="Status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: COLORS.card,
                      color: COLORS.text,
                      border: `1px solid ${COLORS.border}`,

                      "& .MuiMenuItem-root": {
                        py: 1.2,
                      },

                      "& .MuiMenuItem-root:hover": {
                        bgcolor:
                          COLORS.cardHover,
                      },

                      "& .Mui-selected": {
                        bgcolor: `${COLORS.accentSoft} !important`,
                        color: COLORS.accent,
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">
                  All statuses
                </MenuItem>

                <MenuItem value="POSTED">
                  Outstanding
                </MenuItem>

                <MenuItem value="PAID">
                  Paid
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Table Content */}
        {invoices.isLoading ? (
          <LoadingState label="Loading invoices..." />
        ) : invoices.isError ? (
          <ErrorState
            message="Could not load invoices."
            onRetry={() =>
              void invoices.refetch()
            }
          />
        ) : invoices.data!.data.length === 0 ? (
          <EmptyState message="No invoices yet. Generate one from a confirmed sales order." />
        ) : (
          <>
            {/* Invoice Table */}
            <TableContainer
              sx={{
                borderRadius: 2.5,
                border: `1px solid ${COLORS.border}`,
                bgcolor: COLORS.card,
                overflow: "hidden",
              }}
            >
              <Table
                sx={{
                  "& .MuiTableCell-root": {
                    px: 2,
                    py: 1.8,
                  },
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: COLORS.cardHover,
                    }}
                  >
                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Invoice #
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Customer
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Sales Order
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Total
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Outstanding
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {invoices.data!.data.map(
                    (inv) => {
                      const isPaid =
                        inv.status ===
                        "PAID";

                      const hasOutstanding =
                        Number(
                          inv.outstanding
                        ) > 0;

                      return (
                        <TableRow
                          component={
                            RouterLink
                          }
                          to={`/invoices/${inv.id}`}
                          key={inv.id}
                          hover
                          sx={{
                            textDecoration:
                              "none",
                            cursor: "pointer",
                            bgcolor:
                              COLORS.card,

                            "&:hover": {
                              bgcolor:
                                COLORS.cardHover,
                            },

                            "& .MuiTableCell-root":
                              {
                                borderBottom: `1px solid ${COLORS.border}`,
                              },
                          }}
                        >
                          <TableCell>
                            <Typography
                              sx={{
                                color:
                                  COLORS.accent,
                                fontWeight: 600,
                              }}
                            >
                              {
                                inv.invoiceNumber
                              }
                            </Typography>
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                COLORS.text,
                            }}
                          >
                            {inv.customer.name}
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                COLORS.text,
                            }}
                          >
                            {
                              inv.salesOrder
                                .orderNumber
                            }
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                COLORS.text,
                              fontWeight: 600,
                            }}
                          >
                            {money(inv.total)}
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                hasOutstanding
                                  ? COLORS.danger
                                  : COLORS.success,
                              fontWeight: 600,
                            }}
                          >
                            {money(
                              inv.outstanding
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                inv.status
                              }
                              sx={{
                                bgcolor:
                                  isPaid
                                    ? COLORS.successSoft
                                    : COLORS.warningSoft,
                                color:
                                  isPaid
                                    ? COLORS.success
                                    : COLORS.warning,
                                border: `1px solid ${
                                  isPaid
                                    ? COLORS.success
                                    : COLORS.warning
                                }`,
                                borderRadius: 1.5,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "center",
                pt: 1,
              }}
            >
              <Pagination
                page={page}
                count={Math.max(
                  1,
                  invoices.data!.meta
                    .totalPages
                )}
                onChange={(_, value) =>
                  setPage(value)
                }
                sx={{
                  "& .MuiPaginationItem-root":
                    {
                      color:
                        COLORS.muted,
                      borderColor:
                        COLORS.borderStrong,
                    },

                  "& .MuiPaginationItem-root:hover":
                    {
                      bgcolor:
                        COLORS.accentSoft,
                      color:
                        COLORS.accent,
                    },

                  "& .Mui-selected": {
                    bgcolor: `${COLORS.accent} !important`,
                    color:
                      COLORS.page,
                    fontWeight: 700,
                  },

                  "& .Mui-selected:hover":
                    {
                      bgcolor: `${COLORS.accentHover} !important`,
                    },

                  "& .MuiPaginationItem-ellipsis":
                    {
                      color:
                        COLORS.muted,
                    },
                }}
              />
            </Box>
          </>
        )}
      </Stack>
    </DarkContainer>
  );
};