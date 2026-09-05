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
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/vendor-bills.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/feedback/EmptyState";

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

const money = (x: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(x) || 0);

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

export const VendorBillsPage = () => {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const bills = useQuery({
    queryKey: ["vendor-bills", status, page],
    queryFn: () =>
      api.getBills({
        status: status || undefined,
        page,
        pageSize: 20,
      }),
  });

  return (
    <DarkContainer title="Vendor Bills & Payments">
      <Stack spacing={4}>
        {/* Page Header / Filters */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          gap={2.5}
        >
          <Box>
            <Typography
              variant="body1"
              sx={{
                color: COLORS.muted,
                lineHeight: 1.7,
              }}
            >
              Manage supplier invoices, record bank/cash
              payments, and track outstanding payables
            </Typography>
          </Box>

          <FormControl
            size="small"
            sx={{
              minWidth: 190,

              "& .MuiInputLabel-root": {
                color: COLORS.muted,
              },

              "& .MuiInputLabel-root.Mui-focused": {
                color: COLORS.accent,
              },

              "& .MuiOutlinedInput-root": {
                color: COLORS.text,

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

              "& .MuiSvgIcon-root": {
                color: COLORS.muted,
              },
            }}
          >
            <InputLabel>Filter Status</InputLabel>

            <Select
              label="Filter Status"
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
                      bgcolor: COLORS.cardHover,
                    },

                    "& .Mui-selected": {
                      bgcolor: `${COLORS.accentSoft} !important`,
                      color: COLORS.accent,
                    },
                  },
                },
              }}
            >
              <MenuItem value="">All bills</MenuItem>
              <MenuItem value="POSTED">
                Outstanding
              </MenuItem>
              <MenuItem value="PAID">
                Paid
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Loading / Error / Empty */}
        {bills.isLoading ? (
          <LoadingState label="Loading vendor bills..." />
        ) : bills.isError ? (
          <ErrorState
            message="Could not load vendor bills."
            onRetry={() => void bills.refetch()}
          />
        ) : bills.data!.data.length === 0 ? (
          <EmptyState message="No vendor bills found. Confirm a purchase order, then generate its bill." />
        ) : (
          <>
            {/* Bills Table */}
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
                      Bill #
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Vendor
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Purchase Order
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
                  {bills.data!.data.map((b) => {
                    const isPaid = b.status === "PAID";
                    const hasOutstanding =
                      Number(b.outstanding) > 0;

                    return (
                      <TableRow
                        component={RouterLink}
                        to={`/vendor-bills/${b.id}`}
                        key={b.id}
                        hover
                        sx={{
                          textDecoration: "none",
                          cursor: "pointer",
                          bgcolor: COLORS.card,

                          "&:hover": {
                            bgcolor: COLORS.cardHover,
                          },

                          "& .MuiTableCell-root": {
                            borderBottom: `1px solid ${COLORS.border}`,
                          },
                        }}
                      >
                        <TableCell>
                          <Typography
                            sx={{
                              color: COLORS.accent,
                              fontWeight: 600,
                            }}
                          >
                            {b.billNumber}
                          </Typography>
                        </TableCell>

                        <TableCell
                          sx={{
                            color: COLORS.text,
                          }}
                        >
                          {b.vendor.name}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: COLORS.text,
                          }}
                        >
                          {b.purchaseOrder.orderNumber}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: COLORS.text,
                            fontWeight: 600,
                          }}
                        >
                          {money(b.total)}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: hasOutstanding
                              ? COLORS.danger
                              : COLORS.success,
                            fontWeight: 600,
                          }}
                        >
                          {money(b.outstanding)}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={b.status}
                            sx={{
                              bgcolor: isPaid
                                ? COLORS.successSoft
                                : COLORS.warningSoft,
                              color: isPaid
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
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                pt: 1,
              }}
            >
              <Pagination
                page={page}
                count={Math.max(
                  1,
                  bills.data!.meta.totalPages
                )}
                onChange={(_, v) => setPage(v)}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: COLORS.muted,
                    borderColor: COLORS.borderStrong,
                  },

                  "& .MuiPaginationItem-root:hover": {
                    bgcolor: COLORS.accentSoft,
                    color: COLORS.accent,
                  },

                  "& .Mui-selected": {
                    bgcolor: `${COLORS.accent} !important`,
                    color: COLORS.page,
                    fontWeight: 700,
                  },

                  "& .Mui-selected:hover": {
                    bgcolor: `${COLORS.accentHover} !important`,
                  },

                  "& .MuiPaginationItem-ellipsis": {
                    color: COLORS.muted,
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