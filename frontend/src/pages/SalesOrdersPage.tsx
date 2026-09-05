import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
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
import AddIcon from "@mui/icons-material/Add";
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/sales-orders.api";
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
      maxWidth: 1000,
      mx: "auto",
      pt: 4,
      pb: 6,
    }}
  >
    {title && (
      <Box
        sx={{
          bgcolor: COLORS.accentSoft,
          border: `1px solid ${COLORS.borderStrong}`,
          borderRadius: 2,
          py: 1,
          px: 3,
          mb: 3,
          display: "inline-block",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: COLORS.accent,
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>
      </Box>
    )}

    <Box
      sx={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        p: 3,
        bgcolor: COLORS.card,
      }}
    >
      {children}
    </Box>
  </Box>
);

export const SalesOrdersPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const orders = useQuery({
    queryKey: ["sales-orders", search, status, page],
    queryFn: () =>
      api.getSalesOrders({
        search: search || undefined,
        status: status || undefined,
        page,
        pageSize: 20,
      }),
  });

  return (
    <DarkContainer title="Sales Orders">
      <Stack spacing={3}>
        {/* Header Actions */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Typography
            variant="body1"
            sx={{
              color: COLORS.muted,
            }}
          >
            Manage customer sales orders and create invoices
          </Typography>

          <Button
            variant="contained"
            component={RouterLink}
            to="/sales-orders/new"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: COLORS.accent,
              color: "#071313",
              borderRadius: 2,
              px: 3,
              py: 0.9,
              boxShadow: "none",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": {
                bgcolor: COLORS.accentHover,
                boxShadow: "none",
              },
            }}
          >
            New Sales Order
          </Button>
        </Stack>

        {/* Search & Filter */}
        <Box
          sx={{
            bgcolor: COLORS.page,
            p: 2,
            borderRadius: 3,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <TextField
              size="small"
              placeholder="Search order number or customer name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: COLORS.text,
                  bgcolor: COLORS.card,
                  borderRadius: 2,

                  "& fieldset": {
                    borderColor: COLORS.border,
                  },

                  "&:hover fieldset": {
                    borderColor: COLORS.borderStrong,
                  },

                  "&.Mui-focused fieldset": {
                    borderColor: COLORS.accent,
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
                minWidth: 160,
              }}
            >
              <InputLabel
                sx={{
                  color: COLORS.muted,
                  "&.Mui-focused": {
                    color: COLORS.accent,
                  },
                }}
              >
                Status
              </InputLabel>

              <Select
                label="Status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                sx={{
                  color: COLORS.text,
                  bgcolor: COLORS.card,
                  borderRadius: 2,

                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.border,
                  },

                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.borderStrong,
                  },

                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.accent,
                  },

                  "& .MuiSvgIcon-root": {
                    color: COLORS.muted,
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: COLORS.card,
                      color: COLORS.text,
                      border: `1px solid ${COLORS.border}`,
                    },
                  },
                }}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Table Content */}
        {orders.isLoading ? (
          <LoadingState label="Loading sales orders..." />
        ) : orders.isError ? (
          <ErrorState
            message="Could not load sales orders."
            onRetry={() => void orders.refetch()}
          />
        ) : orders.data!.data.length === 0 ? (
          <EmptyState message="No sales orders found. Click + New Sales Order to create one." />
        ) : (
          <>
            <TableContainer
              sx={{
                borderRadius: 3,
                border: `1px solid ${COLORS.border}`,
                bgcolor: COLORS.card,
                overflow: "hidden",
              }}
            >
              <Table>
                <TableHead
                  sx={{
                    bgcolor: COLORS.page,
                  }}
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Order #
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      Date
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
                      Items
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
                  {orders.data!.data.map((o) => (
                    <TableRow
                      component={RouterLink}
                      to={`/sales-orders/${o.id}`}
                      key={o.id}
                      hover
                      sx={{
                        textDecoration: "none",
                        cursor: "pointer",

                        "& td": {
                          borderBottom: `1px solid ${COLORS.border}`,
                        },

                        "&:hover": {
                          bgcolor: COLORS.cardHover,
                        },
                      }}
                    >
                      <TableCell>
                        <Typography
                          fontWeight={600}
                          sx={{
                            color: COLORS.accent,
                          }}
                        >
                          {o.orderNumber}
                        </Typography>
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {new Date(o.orderDate).toLocaleDateString()}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {o.customer.name}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {o._count?.items ??
                          (o.items ? o.items.length : 1)}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                          fontWeight: 600,
                        }}
                      >
                        {money(o.total)}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={o.status}
                          sx={{
                            fontWeight: 600,
                            borderRadius: 1.5,

                            bgcolor:
                              o.status === "CONFIRMED"
                                ? COLORS.successSoft
                                : o.status === "DRAFT"
                                ? COLORS.warningSoft
                                : COLORS.dangerSoft,

                            color:
                              o.status === "CONFIRMED"
                                ? COLORS.success
                                : o.status === "DRAFT"
                                ? COLORS.warning
                                : COLORS.danger,

                            border: `1px solid ${
                              o.status === "CONFIRMED"
                                ? "rgba(111, 207, 151, 0.25)"
                                : o.status === "DRAFT"
                                ? "rgba(217, 184, 108, 0.25)"
                                : "rgba(233, 139, 139, 0.20)"
                            }`,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
              }}
            >
              <Pagination
                page={page}
                count={Math.max(
                  1,
                  orders.data!.meta.totalPages
                )}
                onChange={(_, v) => setPage(v)}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: COLORS.muted,
                    borderColor: COLORS.border,
                  },

                  "& .MuiPaginationItem-root:hover": {
                    bgcolor: COLORS.accentSoft,
                    color: COLORS.accent,
                  },

                  "& .Mui-selected": {
                    bgcolor: `${COLORS.accentSoft} !important`,
                    color: `${COLORS.accent} !important`,
                    border: `1px solid ${COLORS.borderStrong}`,
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