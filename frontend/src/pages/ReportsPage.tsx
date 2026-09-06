import { useState } from "react";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/reports.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";
import { openReportDocument } from "../utils/report-document";

const COLORS = {
  page: "#F8FAFC",
  card: "#FFFFFF",
  cardHover: "#F1F5F9",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",

  text: "#0F172A",
  muted: "#64748B",

  // Primary
  accent: "#0F766E",
  accentHover: "#115E59",
  accentSoft: "#F0FDFA",

  // Positive
  success: "#15803D",
  successSoft: "#F0FDF4",
  successBorder: "#BBF7D0",

  // Negative
  danger: "#B91C1C",
  dangerSoft: "#FEF2F2",
  dangerBorder: "#FECACA",

  // Information
  info: "#0369A1",
  infoSoft: "#F0F9FF",
  infoBorder: "#BAE6FD",

  // Warning / tax
  warning: "#B45309",
  warningSoft: "#FFFBEB",
  warningBorder: "#FDE68A",

  // Navy
  navy: "#172554",
  navySoft: "#EFF6FF",
};

const formatMoney = (amount: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

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
      pb: 7,
      px: { xs: 2, sm: 3 },
    }}
  >
    {title && (
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: COLORS.text,
            fontWeight: 700,
            fontSize: {
              xs: "1.7rem",
              md: "2rem",
            },
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            width: 40,
            height: 3,
            bgcolor: COLORS.accent,
            mt: 1.2,
            borderRadius: 2,
          }}
        />
      </Box>
    )}

    <Box
      sx={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        p: {
          xs: 2.5,
          md: 4,
        },
        bgcolor: COLORS.card,
        boxShadow:
          "0 4px 20px rgba(15, 23, 42, 0.05)",
      }}
    >
      {children}
    </Box>
  </Box>
);

const CustomButton = ({
  children,
  active,
  ...props
}: any) => (
  <Button
    variant={active ? "contained" : "outlined"}
    sx={{
      color: active
        ? "#FFFFFF"
        : COLORS.text,

      bgcolor: active
        ? COLORS.accent
        : "#FFFFFF",

      borderColor: active
        ? COLORS.accent
        : COLORS.borderStrong,

      borderRadius: 2,
      textTransform: "none",
      minWidth: 80,
      px: 2,
      py: 0.9,
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
          ? "#FFFFFF"
          : COLORS.accent,

        boxShadow: "none",
      },

      "&.Mui-disabled": {
        color: "#94A3B8",
        borderColor: COLORS.border,
        backgroundColor: COLORS.page,
      },
    }}
    {...props}
  >
    {children}
  </Button>
);

export const ReportsPage = ({
  initialTab = 0,
}: {
  initialTab?: number;
}) => {
  const [tab, setTab] = useState(initialTab);
  const [selectedYear, setSelectedYear] = useState("2026");

  const balanceSheet = useQuery({
    queryKey: [
      "report-balance-sheet",
      selectedYear,
    ],
    queryFn: () =>
      api.getBalanceSheet(
        `${selectedYear}-12-31T23:59:59.999Z`
      ),
  });

  const profitLoss = useQuery({
    queryKey: [
      "report-profit-loss",
      selectedYear,
    ],
    queryFn: () =>
      api.getProfitLoss({
        startDate:
          `${selectedYear}-01-01T00:00:00.000Z`,
        endDate:
          `${selectedYear}-12-31T23:59:59.999Z`,
      }),
  });

  const budgetReport = useQuery({
    queryKey: [
      "report-budget",
      selectedYear,
    ],
    queryFn: () =>
      api.getBudgetReport(selectedYear),
  });

  const downloadDocument = () => {
    openReportDocument({
      report:
        tab === 0
          ? "profit-loss"
          : tab === 1
          ? "balance-sheet"
          : "budget",

      year: selectedYear,

      profitLoss:
        profitLoss.data,

      balanceSheet:
        balanceSheet.data,

      budget:
        budgetReport.data,
    });
  };

  const pData = profitLoss.data;
  const bData = balanceSheet.data;

  const totalIncome =
    pData?.totals.totalIncome || 0;

  const totalExpense =
    pData?.totals.totalExpense || 0;

  const netIncome =
    pData?.totals.netProfit ||
    totalIncome - totalExpense;

  const purchaseExpense =
    pData?.expenses.find((e) =>
      e.name
        .toLowerCase()
        .includes("purchase")
    )?.amount ||
    Math.round(totalExpense * 0.85);

  const otherExpense =
    totalExpense - purchaseExpense;

  const bankAsset =
    bData?.assets.find((a) =>
      a.name
        .toLowerCase()
        .includes("bank")
    )?.balance || 0;

  const cashAsset =
    bData?.assets.find((a) =>
      a.name
        .toLowerCase()
        .includes("cash")
    )?.balance || 0;

  const debtorAsset =
    bData?.assets.find(
      (a) =>
        a.name
          .toLowerCase()
          .includes("debtor") ||
        a.name
          .toLowerCase()
          .includes("receivable")
    )?.balance || 0;

  const otherAssets =
    (bData?.totals.assets || 0) -
    (bankAsset +
      cashAsset +
      debtorAsset);

  const capitalEquity =
    bData?.capital.reduce(
      (s, c) => s + c.balance,
      0
    ) || 0;

  const creditorLiability =
    bData?.liabilities.find(
      (l) =>
        l.name
          .toLowerCase()
          .includes("creditor") ||
        l.name
          .toLowerCase()
          .includes("payable")
    )?.balance || 0;

  const otherLiabilities =
    (bData?.totals.liabilities || 0) -
    creditorLiability;

  return (
    <DarkContainer
      title={
        tab === 0
          ? "Profit and Loss Report"
          : tab === 1
          ? "Balance Sheet"
          : "Budget Report"
      }
    >
      <Stack spacing={5}>

        {/* ================= NAVIGATION + ACTIONS ================= */}

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
          spacing={3}
        >
          <Tabs
            value={tab}
            onChange={(_, v) =>
              setTab(v)
            }
            sx={{
              minHeight: 44,

              "& .MuiTabs-indicator": {
                backgroundColor:
                  COLORS.accent,
                height: 3,
                borderRadius: 3,
              },

              "& .MuiTab-root": {
                color: COLORS.muted,
                textTransform: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
                minHeight: 44,
                px: 2.2,
              },

              "& .MuiTab-root:hover": {
                color: COLORS.accent,
              },

              "& .Mui-selected": {
                color:
                  `${COLORS.accent} !important`,
                fontWeight: 700,
              },
            }}
          >
            <Tab label="Profit and Loss" />
            <Tab label="Balance Sheet" />
            <Tab label="Budget Report" />
          </Tabs>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <CustomButton
              onClick={downloadDocument}
              startIcon={
                <DownloadOutlinedIcon />
              }
              disabled={
                tab === 0
                  ? !profitLoss.data
                  : tab === 1
                  ? !balanceSheet.data
                  : !budgetReport.data
              }
            >
              Download document
            </CustomButton>

            <TextField
              select
              size="small"
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value
                )
              }
              sx={{
                width: 110,

                "& .MuiOutlinedInput-root": {
                  bgcolor: "#FFFFFF",
                  borderRadius: 2,

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

                "& .MuiSelect-select": {
                  color: COLORS.text,
                  py: 0.95,
                  textAlign: "center",
                  fontWeight: 600,
                },

                "& .MuiSvgIcon-root": {
                  color: COLORS.muted,
                },
              }}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      bgcolor:
                        COLORS.card,
                      color:
                        COLORS.text,
                      border:
                        `1px solid ${COLORS.borderStrong}`,
                      boxShadow:
                        "0 10px 30px rgba(15, 23, 42, 0.12)",
                    },
                  },
                },
              }}
            >
              <MenuItem value="2026">
                2026
              </MenuItem>

              <MenuItem value="2025">
                2025
              </MenuItem>

              <MenuItem value="2024">
                2024
              </MenuItem>
            </TextField>

            <CustomButton
              onClick={() =>
                window.history.back()
              }
            >
              Back
            </CustomButton>
          </Stack>
        </Stack>

        {/* =========================================================
            PROFIT & LOSS
        ========================================================= */}

        {tab === 0 && (
          <Stack spacing={4}>

            {profitLoss.isLoading ? (
              <LoadingState
                label="Computing profit and loss..."
              />
            ) : profitLoss.isError ? (
              <ErrorState
                message="Could not load profit and loss."
                onRetry={() =>
                  void profitLoss.refetch()
                }
              />
            ) : (
              <TableContainer
                sx={{
                  border:
                    `1px solid ${COLORS.border}`,
                  borderRadius: 2.5,
                  overflow: "hidden",
                  bgcolor: COLORS.card,
                  boxShadow:
                    "0 1px 3px rgba(15, 23, 42, 0.04)",
                }}
              >
                <Table size="small">

                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor:
                          COLORS.page,
                      }}
                    >
                      <TableCell
                        sx={{
                          color:
                            COLORS.muted,
                          fontWeight: 700,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        Account
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color:
                            COLORS.muted,
                          fontWeight: 700,
                          width: 220,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        Balance
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>

                    {/* INCOME */}

                    <TableRow
                      sx={{
                        bgcolor:
                          "#F8FAFC",
                      }}
                    >
                      <TableCell
                        sx={{
                          color:
                            COLORS.success,
                          fontWeight: 700,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                          borderLeft:
                            `4px solid ${COLORS.success}`,
                        }}
                      >
                        Income
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color:
                            COLORS.success,
                          fontWeight: 700,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(
                          totalIncome
                        )}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          color:
                            COLORS.text,
                          pl: 5,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        Income from Sales
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color:
                            COLORS.text,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(
                          totalIncome
                        )}
                      </TableCell>
                    </TableRow>

                    {/* EXPENSES */}

                    <TableRow
                      sx={{
                        bgcolor:
                          "#F8FAFC",
                      }}
                    >
                      <TableCell
                        sx={{
                          color:
                            COLORS.danger,
                          fontWeight: 700,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                          borderLeft:
                            `4px solid ${COLORS.danger}`,
                        }}
                      >
                        Expenses
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color:
                            COLORS.danger,
                          fontWeight: 700,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(
                          totalExpense
                        )}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          color:
                            COLORS.text,
                          pl: 5,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        Purchase Expense
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color:
                            COLORS.text,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(
                          purchaseExpense
                        )}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          color:
                            COLORS.text,
                          pl: 5,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        Other Expense
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color:
                            COLORS.text,
                          py: 2,
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(
                          otherExpense
                        )}
                      </TableCell>
                    </TableRow>

                    {/* NET INCOME */}

                    <TableRow
                      sx={{
                        bgcolor:
                          netIncome >= 0
                            ? COLORS.successSoft
                            : COLORS.dangerSoft,
                      }}
                    >
                      <TableCell
                        sx={{
                          color:
                            COLORS.text,
                          fontWeight: 800,
                          fontSize: "1rem",
                          py: 2.2,
                          borderTop:
                            `2px solid ${
                              netIncome >= 0
                                ? COLORS.successBorder
                                : COLORS.dangerBorder
                            }`,
                        }}
                      >
                        Net Income
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color:
                            netIncome >= 0
                              ? COLORS.success
                              : COLORS.danger,
                          fontWeight: 800,
                          fontSize: "1rem",
                          py: 2.2,
                          borderTop:
                            `2px solid ${
                              netIncome >= 0
                                ? COLORS.successBorder
                                : COLORS.dangerBorder
                            }`,
                        }}
                      >
                        {formatMoney(
                          netIncome
                        )}
                      </TableCell>
                    </TableRow>

                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* COMPUTATION NOTE */}

            <Paper
              sx={{
                p: 2.5,
                bgcolor:
                  COLORS.page,
                border:
                  `1px dashed ${COLORS.borderStrong}`,
                borderRadius: 2.5,
                boxShadow: "none",
              }}
            >
              <Typography
                sx={{
                  color:
                    COLORS.text,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  mb: 1.2,
                }}
              >
                Field Computation
              </Typography>

              <Stack spacing={0.8}>
                <Typography
                  sx={{
                    color:
                      COLORS.muted,
                    fontSize:
                      "0.78rem",
                  }}
                >
                  • <b>Income:</b>{" "}
                  Total of Income
                  accounts (Sales
                  Revenue)
                </Typography>

                <Typography
                  sx={{
                    color:
                      COLORS.muted,
                    fontSize:
                      "0.78rem",
                  }}
                >
                  • <b>Expenses:</b>{" "}
                  Total of all
                  expense accounts
                </Typography>

                <Typography
                  sx={{
                    color:
                      COLORS.muted,
                    fontSize:
                      "0.78rem",
                  }}
                >
                  • <b>Net Income:</b>{" "}
                  Income − Expenses
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* =========================================================
            BALANCE SHEET
        ========================================================= */}

        {tab === 1 && (
          <Stack spacing={4}>

            {balanceSheet.isLoading ? (
              <LoadingState
                label="Computing balance sheet..."
              />
            ) : balanceSheet.isError ? (
              <ErrorState
                message="Could not load balance sheet."
                onRetry={() =>
                  void balanceSheet.refetch()
                }
              />
            ) : (
              <Box
                sx={{
                  border:
                    `1px solid ${COLORS.border}`,
                  borderRadius: 2.5,
                  overflow: "hidden",
                  bgcolor:
                    COLORS.card,
                  boxShadow:
                    "0 1px 3px rgba(15, 23, 42, 0.04)",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1fr 1fr",
                    },
                  }}
                >

                  {/* ASSETS */}

                  <Box
                    sx={{
                      borderRight: {
                        xs: "none",
                        md:
                          `1px solid ${COLORS.border}`,
                      },

                      borderBottom: {
                        xs:
                          `1px solid ${COLORS.border}`,
                        md: "none",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderBottom:
                          `1px solid ${COLORS.border}`,
                        bgcolor:
                          COLORS.accentSoft,
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            COLORS.accent,
                          fontWeight: 700,
                          fontSize:
                            "0.9rem",
                        }}
                        align="center"
                      >
                        Assets
                      </Typography>
                    </Box>

                    <Table size="small">
                      <TableBody>

                        {[
                          [
                            "Bank",
                            bankAsset,
                          ],
                          [
                            "Cash",
                            cashAsset,
                          ],
                          [
                            "Debtors",
                            debtorAsset,
                          ],
                        ].map(
                          ([label, value]) => (
                            <TableRow
                              key={label}
                            >
                              <TableCell
                                sx={{
                                  color:
                                    COLORS.text,
                                  py: 2,
                                  borderBottom:
                                    `1px solid ${COLORS.border}`,
                                }}
                              >
                                {label}
                              </TableCell>

                              <TableCell
                                align="right"
                                sx={{
                                  color:
                                    COLORS.text,
                                  py: 2,
                                  borderBottom:
                                    `1px solid ${COLORS.border}`,
                                }}
                              >
                                {formatMoney(
                                  value as number
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        )}

                        {otherAssets > 0 && (
                          <TableRow>
                            <TableCell
                              sx={{
                                color:
                                  COLORS.muted,
                                py: 2,
                                borderBottom:
                                  `1px solid ${COLORS.border}`,
                              }}
                            >
                              Other Assets
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                color:
                                  COLORS.text,
                                py: 2,
                                borderBottom:
                                  `1px solid ${COLORS.border}`,
                              }}
                            >
                              {formatMoney(
                                otherAssets
                              )}
                            </TableCell>
                          </TableRow>
                        )}

                      </TableBody>
                    </Table>

                    <Box
                      sx={{
                        p: 2.2,
                        borderTop:
                          `2px solid ${COLORS.borderStrong}`,
                        bgcolor:
                          COLORS.accentSoft,
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            COLORS.text,
                          fontWeight: 800,
                        }}
                      >
                        Total Assets
                      </Typography>

                      <Typography
                        sx={{
                          color:
                            COLORS.accent,
                          fontWeight: 800,
                        }}
                      >
                        {formatMoney(
                          bData?.totals
                            .assets || 0
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  {/* LIABILITIES & CAPITAL */}

                  <Box>
                    <Box
                      sx={{
                        p: 2,
                        borderBottom:
                          `1px solid ${COLORS.border}`,
                        bgcolor:
                          COLORS.warningSoft,
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            COLORS.warning,
                          fontWeight: 700,
                          fontSize:
                            "0.9rem",
                        }}
                        align="center"
                      >
                        Liabilities & Capital
                      </Typography>
                    </Box>

                    <Table size="small">
                      <TableBody>

                        <TableRow>
                          <TableCell
                            sx={{
                              color:
                                COLORS.text,
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            Capital
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                COLORS.text,
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            {formatMoney(
                              capitalEquity
                            )}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell
                            sx={{
                              color:
                                COLORS.text,
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            Creditors
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                COLORS.text,
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            {formatMoney(
                              creditorLiability
                            )}
                          </TableCell>
                        </TableRow>

                        {otherLiabilities > 0 && (
                          <TableRow>
                            <TableCell
                              sx={{
                                color:
                                  COLORS.muted,
                                py: 2,
                                borderBottom:
                                  `1px solid ${COLORS.border}`,
                              }}
                            >
                              Other Liabilities
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                color:
                                  COLORS.text,
                                py: 2,
                                borderBottom:
                                  `1px solid ${COLORS.border}`,
                              }}
                            >
                              {formatMoney(
                                otherLiabilities
                              )}
                            </TableCell>
                          </TableRow>
                        )}

                      </TableBody>
                    </Table>

                    <Box
                      sx={{
                        p: 2.2,
                        borderTop:
                          `2px solid ${COLORS.borderStrong}`,
                        bgcolor:
                          COLORS.navySoft,
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            COLORS.text,
                          fontWeight: 800,
                        }}
                      >
                        Total Liabilities & Capital
                      </Typography>

                      <Typography
                        sx={{
                          color:
                            COLORS.navy,
                          fontWeight: 800,
                        }}
                      >
                        {formatMoney(
                          (bData?.totals
                            .liabilities ||
                            0) +
                            capitalEquity
                        )}
                      </Typography>
                    </Box>
                  </Box>

                </Box>
              </Box>
            )}

            {/* CLASSIFICATION NOTE */}

            <Paper
              sx={{
                p: 2.5,
                bgcolor:
                  COLORS.page,
                border:
                  `1px dashed ${COLORS.borderStrong}`,
                borderRadius: 2.5,
                boxShadow: "none",
              }}
            >
              <Typography
                sx={{
                  color:
                    COLORS.text,
                  fontSize:
                    "0.82rem",
                  fontWeight: 700,
                  mb: 1.2,
                }}
              >
                Account Classifications
              </Typography>

              <Stack spacing={0.8}>
                <Typography
                  sx={{
                    color:
                      COLORS.muted,
                    fontSize:
                      "0.78rem",
                  }}
                >
                  • <b>Bank / Cash:</b>{" "}
                  Asset accounts ·{" "}
                  <b>Debtors:</b>{" "}
                  Asset accounts
                </Typography>

                <Typography
                  sx={{
                    color:
                      COLORS.muted,
                    fontSize:
                      "0.78rem",
                  }}
                >
                  • <b>Creditors:</b>{" "}
                  Liability accounts ·{" "}
                  <b>Capital:</b>{" "}
                  Capital accounts
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* =========================================================
            BUDGET REPORT
        ========================================================= */}

        {tab === 2 && (
          <Stack spacing={4}>

            {budgetReport.isLoading ? (
              <LoadingState
                label="Computing budget report..."
              />
            ) : budgetReport.isError ? (
              <ErrorState
                message="Could not load budget report."
                onRetry={() =>
                  void budgetReport.refetch()
                }
              />
            ) : (
              <TableContainer
                sx={{
                  border:
                    `1px solid ${COLORS.border}`,
                  borderRadius: 2.5,
                  overflowX: "auto",
                  bgcolor:
                    COLORS.card,
                  boxShadow:
                    "0 1px 3px rgba(15, 23, 42, 0.04)",
                }}
              >
                <Table size="small">

                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor:
                          COLORS.page,
                      }}
                    >
                      {[
                        "Budget",
                        "Period",
                        "Analytic Account",
                        "Planned",
                        "Achieved",
                        "Remaining",
                      ].map(
                        (
                          label,
                          index
                        ) => (
                          <TableCell
                            key={label}
                            align={
                              index >= 3
                                ? "right"
                                : "left"
                            }
                            sx={{
                              color:
                                COLORS.muted,
                              fontWeight: 700,
                              py: 2,
                              whiteSpace:
                                "nowrap",
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            {label}
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {budgetReport.data?.data.map(
                      (b) => (
                        <TableRow
                          key={b.id}
                          sx={{
                            "&:hover": {
                              bgcolor:
                                COLORS.cardHover,
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              color:
                                COLORS.text,
                              fontWeight: 600,
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            {b.name}
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                COLORS.muted,
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            {b.period}
                          </TableCell>

                          <TableCell
                            sx={{
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            <Chip
                              size="small"
                              label={
                                b.analyticAccount
                              }
                              sx={{
                                bgcolor:
                                  COLORS.accentSoft,
                                color:
                                  COLORS.accent,
                                border:
                                  `1px solid ${COLORS.accent}40`,
                                fontWeight: 600,
                                borderRadius: 1.5,
                              }}
                            />
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                COLORS.info,
                              fontWeight: 600,
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            {formatMoney(
                              b.plannedAmount
                            )}
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                COLORS.success,
                              fontWeight: 600,
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            {formatMoney(
                              b.achievedAmount
                            )}
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                COLORS.warning,
                              fontWeight: 600,
                              py: 2,
                              borderBottom:
                                `1px solid ${COLORS.border}`,
                            }}
                          >
                            {formatMoney(
                              b.remainingAmount
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>

                </Table>
              </TableContainer>
            )}
          </Stack>
        )}

      </Stack>
    </DarkContainer>
  );
};