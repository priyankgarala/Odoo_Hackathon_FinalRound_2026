import { useState, useMemo } from "react";
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
import * as api from "../api/purchase-orders.api";
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

const money = (v: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(v) || 0);

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

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: COLORS.text,
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

  "& .MuiInputLabel-root": {
    color: COLORS.muted,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: COLORS.accent,
  },
};

const selectSx = {
  color: COLORS.text,
  borderRadius: 2,

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: COLORS.borderStrong,
  },

  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: COLORS.accent,
  },

  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: COLORS.accent,
  },

  "& .MuiSvgIcon-root": {
    color: COLORS.muted,
  },
};

const selectMenuProps = {
  PaperProps: {
    sx: {
      bgcolor: COLORS.card,
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
      maxHeight: 320,

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
};

export const PurchaseOrdersPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      page,
      pageSize: 20,
    }),
    [search, status, page]
  );

  const orders = useQuery({
    queryKey: ["purchase-orders", params],
    queryFn: () => api.getPurchaseOrders(params),
  });

  return (
    <DarkContainer title="Purchase Orders">
      <Stack spacing={4}>
        {/* Header */}
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
          gap={3}
        >
          <Box>
            <Typography
              variant="body1"
              sx={{
                color: COLORS.muted,
                lineHeight: 1.7,
              }}
            >
              Vendor purchasing workflow with budget analytics
              and price snapshots
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to="/purchase-orders/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              alignSelf: {
                xs: "flex-start",
                md: "auto",
              },
              bgcolor: COLORS.accent,
              color: COLORS.page,
              borderRadius: 2,
              px: 2.5,
              py: 1,
              boxShadow: "none",
              textTransform: "none",
              fontWeight: 600,

              "&:hover": {
                bgcolor: COLORS.accentHover,
                boxShadow: "none",
              },
            }}
          >
            Create Purchase Order
          </Button>
        </Stack>

        {/* Filters */}
        <Box
          sx={{
            bgcolor: COLORS.cardHover,
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2.5,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2.5}
          >
            <TextField
              size="small"
              placeholder="Search order number or vendor name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              fullWidth
              sx={fieldSx}
            />

            <FormControl
              size="small"
              sx={{
                minWidth: {
                  xs: "100%",
                  sm: 180,
                },
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
                sx={selectSx}
                MenuProps={selectMenuProps}
              >
                <MenuItem value="">
                  All statuses
                </MenuItem>

                <MenuItem value="DRAFT">
                  Draft
                </MenuItem>

                <MenuItem value="CONFIRMED">
                  Confirmed
                </MenuItem>

                <MenuItem value="CANCELLED">
                  Cancelled
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Table */}
        {orders.isLoading ? (
          <LoadingState label="Loading purchase orders..." />
        ) : orders.isError ? (
          <ErrorState
            message="Could not load purchase orders."
            onRetry={() => void orders.refetch()}
          />
        ) : orders.data!.data.length === 0 ? (
          <EmptyState
            message="No purchase orders found. Click Create Purchase Order to add one."
          />
        ) : (
          <>
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
                      Vendor
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
                      key={o.id}
                      hover
                      component={RouterLink}
                      to={`/purchase-orders/${o.id}`}
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

                        "&:last-child .MuiTableCell-root": {
                          borderBottom: "none",
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
                          {o.orderNumber}
                        </Typography>
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {new Date(
                          o.orderDate
                        ).toLocaleDateString()}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {o.vendor.name}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {o._count?.items ??
                          (o.items
                            ? o.items.length
                            : 1)}
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

                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 1.5,
                            fontWeight: 500,
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
                pt: 1,
              }}
            >
              <Pagination
                page={page}
                count={Math.max(
                  1,
                  orders.data!.meta.totalPages
                )}
                onChange={(_, value) =>
                  setPage(value)
                }
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: COLORS.muted,
                    borderRadius: 1.5,
                  },

                  "& .MuiPaginationItem-root:hover": {
                    bgcolor: COLORS.accentSoft,
                    color: COLORS.accent,
                  },

                  "& .Mui-selected": {
                    bgcolor: `${COLORS.accentSoft} !important`,
                    color: `${COLORS.accent} !important`,
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