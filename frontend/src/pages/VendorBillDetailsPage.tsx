import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import PrintIcon from "@mui/icons-material/Print";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/vendor-bills.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";

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

const formatMoney = (value: string | number) =>
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
        maxHeight: 320,
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
  },
};

const CustomButton = ({
  children,
  active,
  ...props
}: any) => (
  <Button
    variant="outlined"
    sx={{
      color: active ? COLORS.page : COLORS.text,
      bgcolor: active ? COLORS.accent : "transparent",
      borderColor: active
        ? COLORS.accent
        : COLORS.borderStrong,
      borderRadius: 2,
      textTransform: "none",
      minWidth: 90,
      px: 2,
      py: 0.9,
      fontWeight: 500,

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

export const VendorBillDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [payType, setPayType] = useState("SEND");
  const [amount, setAmount] = useState("");
  const [paymentVia, setPaymentVia] = useState("Bank");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [memo, setMemo] = useState("");

  const bill = useQuery({
    queryKey: ["vendor-bill", id],
    queryFn: () => api.getBill(Number(id)),
    enabled: Boolean(id),
  });

  const payment = useMutation({
    mutationFn: () =>
      api.payBill({
        id: Number(id),
        amount: Number(amount),
        paymentMethod: paymentVia,
        reference: memo || undefined,
      }),

    onSuccess: () => {
      setSuccess(
        `Payment of ${formatMoney(
          amount
        )} completed and posted to ${paymentVia} Journal.`
      );

      setPaymentOpen(false);

      queryClient.invalidateQueries({
        queryKey: ["vendor-bill", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["vendor-bills"],
      });
    },
  });

  if (bill.isLoading) {
    return <LoadingState label="Loading vendor bill..." />;
  }

  if (bill.isError || !bill.data) {
    return (
      <ErrorState
        message="Vendor bill could not be loaded."
        onRetry={() => void bill.refetch()}
      />
    );
  }

  const current = bill.data;

  const totalNum = Number(current.total) || 0;
  const outstandingNum =
    Number(current.outstanding) || 0;
  const paidNum =
    Number(current.paidAmount) || 0;

  const statusLabel =
    outstandingNum === 0
      ? "Paid"
      : paidNum > 0
      ? "Part Paid"
      : "Not Paid";

  const statusColor =
    statusLabel === "Paid"
      ? COLORS.success
      : statusLabel === "Part Paid"
      ? COLORS.warning
      : COLORS.danger;

  const paidViaBank =
    current.payments
      ?.filter((p) =>
        p.paymentMethod
          ?.toLowerCase()
          .includes("bank")
      )
      .reduce(
        (sum, p) => sum + Number(p.amount),
        0
      ) || 0;

  const paidViaCash =
    current.payments
      ?.filter((p) =>
        p.paymentMethod
          ?.toLowerCase()
          .includes("cash")
      )
      .reduce(
        (sum, p) => sum + Number(p.amount),
        0
      ) || 0;

  const openPaymentModal = () => {
    setAmount(String(current.outstanding));
    setPaymentVia("Bank");
    setPayDate(
      new Date().toISOString().slice(0, 10)
    );
    setMemo(
      `Bill payment for ${current.billNumber}`
    );
    setPaymentOpen(true);
  };

  return (
    <DarkContainer title="Vendor Bill">
      <Stack spacing={4}>
        {/* Header Toolbar */}
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
          gap={2.5}
        >
          <Stack
            direction="row"
            spacing={1.5}
          >
            {outstandingNum > 0 && (
              <CustomButton
                active
                onClick={openPaymentModal}
              >
                Pay
              </CustomButton>
            )}
          </Stack>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
          >
            {current.purchaseOrder && (
              <CustomButton
                component={RouterLink}
                to={`/purchase-orders/${current.purchaseOrder.id}`}
              >
                PO
              </CustomButton>
            )}

            <CustomButton
              component={RouterLink}
              to="/reports/budget"
            >
              Budget
            </CustomButton>

            <CustomButton
              onClick={() => window.print()}
            >
              Print
            </CustomButton>

            <CustomButton
              onClick={() =>
                navigate("/vendor-bills")
              }
            >
              Back
            </CustomButton>
          </Stack>
        </Stack>

        {success && (
          <Alert
            severity="success"
            sx={{
              bgcolor: COLORS.successSoft,
              color: COLORS.success,
              border: `1px solid ${COLORS.success}`,
              borderRadius: 2,
            }}
          >
            {success}
          </Alert>
        )}

        {/* Bill Information */}
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2.5,
            bgcolor: COLORS.cardHover,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: COLORS.text,
              fontWeight: 600,
              mb: 3,
            }}
          >
            Bill Information
          </Typography>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={{
              xs: 3,
              md: 6,
            }}
          >
            <Stack spacing={2.5} flex={1}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 140,
                  }}
                >
                  Vendor Bill No.
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: COLORS.accent,
                    fontWeight: 700,
                  }}
                >
                  {current.billNumber}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 140,
                  }}
                >
                  Vendor Name
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.text,
                    fontWeight: 600,
                  }}
                >
                  {current.vendor.name}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 140,
                  }}
                >
                  Status
                </Typography>

                <Chip
                  label={statusLabel}
                  sx={{
                    bgcolor:
                      statusLabel === "Paid"
                        ? COLORS.successSoft
                        : statusLabel === "Part Paid"
                        ? COLORS.warningSoft
                        : COLORS.dangerSoft,
                    color: statusColor,
                    fontWeight: 600,
                    border: `1px solid ${statusColor}`,
                    borderRadius: 1.5,
                  }}
                />
              </Stack>
            </Stack>

            <Stack spacing={2.5} flex={1}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 140,
                  }}
                >
                  Bill Reference
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.text,
                  }}
                >
                  {current.referenceId ||
                    current.billNumber}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 140,
                  }}
                >
                  Bill Date
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.text,
                  }}
                >
                  {current.billDate
                    ? new Date(
                        current.billDate
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : new Date().toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 140,
                  }}
                >
                  Due Date
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.text,
                  }}
                >
                  {current.dueDate
                    ? new Date(
                        current.dueDate
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : new Date(
                        Date.now() +
                          15 * 86400000
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Items */}
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              color: COLORS.text,
              fontWeight: 600,
              mb: 2,
            }}
          >
            Bill Items
          </Typography>

          <TableContainer
            sx={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2.5,
              bgcolor: COLORS.card,
              overflow: "hidden",
            }}
          >
            <Table
              size="small"
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
                      width: 50,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Sr.
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
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      width: 70,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Qty
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      width: 110,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Unit Price
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      width: 120,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Subtotal
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      width: 110,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Tax Amount
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      width: 120,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {current.items?.map(
                  (item, idx) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        bgcolor: COLORS.card,

                        "&:hover": {
                          bgcolor:
                            COLORS.cardHover,
                        },

                        "& .MuiTableCell-root": {
                          borderBottom: `1px solid ${COLORS.border}`,
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          color: COLORS.muted,
                        }}
                      >
                        {idx + 1}.
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                          fontWeight: 600,
                        }}
                      >
                        {item.productName}

                        {item.taxLines &&
                          item.taxLines.length >
                            0 && (
                            <Box
                              sx={{
                                mt: 1,
                                display: "flex",
                                gap: 0.75,
                                flexWrap: "wrap",
                              }}
                            >
                              {item.taxLines.map(
                                (tl) => (
                                  <Chip
                                    key={tl.id}
                                    label={`${tl.taxName}: ${formatMoney(
                                      tl.taxAmount
                                    )}`}
                                    size="small"
                                    sx={{
                                      bgcolor:
                                        COLORS.infoSoft,
                                      color:
                                        COLORS.info,
                                      fontSize:
                                        "0.7rem",
                                      height: 22,
                                      borderRadius: 1,
                                    }}
                                  />
                                )
                              )}
                            </Box>
                          )}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {item.quantity}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {formatMoney(
                          item.unitPrice
                        )}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {formatMoney(
                          item.lineSubtotal ||
                            Number(
                              item.unitPrice
                            ) *
                              Number(
                                item.quantity
                              )
                        )}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.warning,
                          fontWeight: 600,
                        }}
                      >
                        {formatMoney(
                          item.taxAmount
                        )}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                          fontWeight: 600,
                        }}
                      >
                        {formatMoney(
                          item.lineTotal
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Financial Breakdown */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Stack
            spacing={1.5}
            sx={{
              minWidth: {
                xs: "100%",
                sm: 320,
              },
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: COLORS.cardHover,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
            >
              <Typography
                sx={{ color: COLORS.muted }}
              >
                Subtotal:
              </Typography>

              <Typography
                sx={{ color: COLORS.text }}
              >
                {formatMoney(
                  current.subtotal ||
                    totalNum
                )}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
            >
              <Typography
                sx={{
                  color: COLORS.warning,
                  fontWeight: 600,
                }}
              >
                Total Tax (GST):
              </Typography>

              <Typography
                sx={{
                  color: COLORS.warning,
                  fontWeight: 600,
                }}
              >
                {formatMoney(
                  current.taxTotal || 0
                )}
              </Typography>
            </Stack>

            <Box
              sx={{
                borderTop: `1px solid ${COLORS.border}`,
                pt: 1.5,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography
                  sx={{
                    color: COLORS.text,
                    fontWeight: 700,
                  }}
                >
                  Grand Total:
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.text,
                    fontWeight: 700,
                  }}
                >
                  {formatMoney(totalNum)}
                </Typography>
              </Stack>
            </Box>

            <Stack
              direction="row"
              justifyContent="space-between"
            >
              <Typography
                sx={{ color: COLORS.muted }}
              >
                Paid Amount:
              </Typography>

              <Typography
                sx={{ color: COLORS.text }}
              >
                {formatMoney(paidNum)}
              </Typography>
            </Stack>

            <Box
              sx={{
                borderTop: `1px dashed ${COLORS.borderStrong}`,
                pt: 1.5,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography
                  sx={{
                    color: COLORS.danger,
                    fontWeight: 700,
                  }}
                >
                  Amount Due:
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.danger,
                    fontWeight: 700,
                  }}
                >
                  {formatMoney(
                    outstandingNum
                  )}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Accounting Note */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: COLORS.infoSoft,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: COLORS.muted,
              lineHeight: 1.7,
            }}
          >
            As soon as the vendor bill is
            confirmed, a journal entry is
            created in the Journal Entries
            section. The Purchase Journal
            debits Purchase Expense and
            credits Creditor.
          </Typography>
        </Box>

        {/* Payment Dialog */}
        <Dialog
          open={paymentOpen}
          onClose={() =>
            setPaymentOpen(false)
          }
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              bgcolor: COLORS.card,
              border: `1px solid ${COLORS.borderStrong}`,
              borderRadius: 3,
              color: COLORS.text,
            },
          }}
        >
          <DialogTitle
            sx={{
              px: 3,
              pt: 3,
              pb: 2,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="h6"
                sx={{
                  color: COLORS.text,
                  fontWeight: 700,
                }}
              >
                Bill Payment
              </Typography>

              <IconButton
                onClick={() =>
                  window.print()
                }
                sx={{
                  color: COLORS.muted,

                  "&:hover": {
                    color: COLORS.accent,
                    bgcolor:
                      COLORS.accentSoft,
                  },
                }}
              >
                <PrintIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 3 }}>
            <Stack spacing={3}>
              {payment.isError && (
                <Alert
                  severity="error"
                  sx={{
                    bgcolor: COLORS.dangerSoft,
                    color: COLORS.danger,
                    border: `1px solid ${COLORS.danger}`,
                    borderRadius: 2,
                  }}
                >
                  Payment failed. Check the
                  entered amount.
                </Alert>
              )}

              <FormControl component="fieldset">
                <FormLabel
                  sx={{
                    color: COLORS.muted,
                    mb: 1,
                  }}
                >
                  Payment Type
                </FormLabel>

                <RadioGroup
                  row
                  value={payType}
                  onChange={(e) =>
                    setPayType(
                      e.target.value
                    )
                  }
                >
                  <FormControlLabel
                    value="SEND"
                    control={
                      <Radio
                        sx={{
                          color: COLORS.muted,
                          "&.Mui-checked": {
                            color: COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Send"
                    sx={{
                      color: COLORS.text,
                    }}
                  />

                  <FormControlLabel
                    value="RECEIVE"
                    control={
                      <Radio
                        sx={{
                          "&.Mui-checked": {
                            color: COLORS.accent,
                          },
                        }}
                      />
                    }
                    label="Receive"
                    disabled
                    sx={{
                      color: COLORS.muted,
                    }}
                  />
                </RadioGroup>
              </FormControl>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 120,
                  }}
                >
                  Partner
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.text,
                    fontWeight: 600,
                  }}
                >
                  {current.vendor.name}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 120,
                  }}
                >
                  Amount
                </Typography>

                <TextField
                  type="number"
                  variant="standard"
                  fullWidth
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
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
                  sx={{
                    color: COLORS.muted,
                    minWidth: 120,
                  }}
                >
                  Date
                </Typography>

                <TextField
                  type="date"
                  variant="standard"
                  fullWidth
                  value={payDate}
                  onChange={(e) =>
                    setPayDate(
                      e.target.value
                    )
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
                  sx={{
                    color: COLORS.muted,
                    minWidth: 120,
                  }}
                >
                  Payment Via
                </Typography>

                <TextField
                  select
                  variant="standard"
                  fullWidth
                  value={paymentVia}
                  onChange={(e) =>
                    setPaymentVia(
                      e.target.value
                    )
                  }
                  sx={darkTextFieldSx}
                  SelectProps={
                    darkSelectProps
                  }
                >
                  <MenuItem value="Bank">
                    Bank
                  </MenuItem>

                  <MenuItem value="Cash">
                    Cash
                  </MenuItem>
                </TextField>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 120,
                  }}
                >
                  Memo
                </Typography>

                <TextField
                  variant="standard"
                  fullWidth
                  placeholder="Alpha Numeric (Text)"
                  value={memo}
                  onChange={(e) =>
                    setMemo(
                      e.target.value
                    )
                  }
                  sx={darkTextFieldSx}
                />
              </Stack>
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              py: 2.5,
              gap: 1.5,
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <Button
              onClick={() =>
                setPaymentOpen(false)
              }
              sx={{
                color: COLORS.muted,
                textTransform: "none",
                borderRadius: 2,

                "&:hover": {
                  color: COLORS.text,
                  bgcolor:
                    COLORS.cardHover,
                },
              }}
            >
              Cancel
            </Button>

            <CustomButton
              active
              disabled={
                !amount ||
                Number(amount) <= 0 ||
                Number(amount) >
                  outstandingNum ||
                payment.isPending
              }
              onClick={() =>
                payment.mutate()
              }
            >
              {payment.isPending
                ? "Confirming..."
                : "Confirm"}
            </CustomButton>
          </DialogActions>
        </Dialog>
      </Stack>
    </DarkContainer>
  );
};