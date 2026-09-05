import { useState } from "react";
import PrintIcon from "@mui/icons-material/Print";
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

  info: "#7FA9C9",
  infoSoft: "rgba(127, 169, 201, 0.10)",
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
            fontSize: { xs: "1.7rem", md: "2rem" },
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            width: 36,
            height: 2,
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
        p: { xs: 2.5, md: 4 },
        bgcolor: COLORS.card,
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
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
      color: active ? "#071414" : COLORS.muted,
      bgcolor: active ? COLORS.accent : "transparent",
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
        color: active ? "#071414" : COLORS.text,
        boxShadow: "none",
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
    queryKey: ["report-balance-sheet", selectedYear],
    queryFn: () =>
      api.getBalanceSheet(
        `${selectedYear}-12-31T23:59:59.999Z`
      ),
  });

  const profitLoss = useQuery({
    queryKey: ["report-profit-loss", selectedYear],
    queryFn: () =>
      api.getProfitLoss({
        startDate: `${selectedYear}-01-01T00:00:00.000Z`,
        endDate: `${selectedYear}-12-31T23:59:59.999Z`,
      }),
  });

  const budgetReport = useQuery({
    queryKey: ["report-budget", selectedYear],
    queryFn: () => api.getBudgetReport(selectedYear),
  });

  const handlePrint = () => {
    window.print();
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
      e.name.toLowerCase().includes("purchase")
    )?.amount ||
    Math.round(totalExpense * 0.85);

  const otherExpense =
    totalExpense - purchaseExpense;

  const bankAsset =
    bData?.assets.find((a) =>
      a.name.toLowerCase().includes("bank")
    )?.balance || 0;

  const cashAsset =
    bData?.assets.find((a) =>
      a.name.toLowerCase().includes("cash")
    )?.balance || 0;

  const debtorAsset =
    bData?.assets.find(
      (a) =>
        a.name.toLowerCase().includes("debtor") ||
        a.name.toLowerCase().includes("receivable")
    )?.balance || 0;

  const otherAssets =
    (bData?.totals.assets || 0) -
    (bankAsset + cashAsset + debtorAsset);

  const capitalEquity =
    bData?.capital.reduce(
      (s, c) => s + c.balance,
      0
    ) || 0;

  const creditorLiability =
    bData?.liabilities.find(
      (l) =>
        l.name.toLowerCase().includes("creditor") ||
        l.name.toLowerCase().includes("payable")
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
        {/* Navigation + Actions */}
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
          spacing={3}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              minHeight: 44,

              "& .MuiTabs-indicator": {
                backgroundColor: COLORS.accent,
                height: 2,
                borderRadius: 2,
              },

              "& .MuiTab-root": {
                color: COLORS.muted,
                textTransform: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
                minHeight: 44,
                px: 2.2,
              },

              "& .Mui-selected": {
                color: `${COLORS.accent} !important`,
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
              onClick={handlePrint}
              startIcon={<PrintIcon />}
            >
              Print
            </CustomButton>

            <TextField
              select
              size="small"
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(e.target.value)
              }
              sx={{
                width: 110,

                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.025)",
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
                      bgcolor: "#101A2B",
                      color: COLORS.text,
                      border: `1px solid ${COLORS.borderStrong}`,
                    },
                  },
                },
              }}
            >
              <MenuItem value="2026">2026</MenuItem>
              <MenuItem value="2025">2025</MenuItem>
              <MenuItem value="2024">2024</MenuItem>
            </TextField>

            <CustomButton
              onClick={() => window.history.back()}
            >
              Back
            </CustomButton>
          </Stack>
        </Stack>

        {/* ================= PROFIT & LOSS ================= */}
        {tab === 0 && (
          <Stack spacing={4}>
            {profitLoss.isLoading ? (
              <LoadingState label="Computing profit and loss..." />
            ) : profitLoss.isError ? (
              <ErrorState
                message="Could not load profit and loss."
                onRetry={() => void profitLoss.refetch()}
              />
            ) : (
              <TableContainer
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 2.5,
                  overflow: "hidden",
                  bgcolor: COLORS.page,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: COLORS.cardHover,
                      }}
                    >
                      <TableCell
                        sx={{
                          color: COLORS.muted,
                          fontWeight: 700,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        Account
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.muted,
                          fontWeight: 700,
                          width: 220,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        Balance
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {/* Income */}
                    <TableRow
                      sx={{
                        bgcolor: COLORS.successSoft,
                      }}
                    >
                      <TableCell
                        sx={{
                          color: COLORS.success,
                          fontWeight: 700,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        Income
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.success,
                          fontWeight: 700,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(totalIncome)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          color: COLORS.text,
                          pl: 5,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        Income from Sales
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(totalIncome)}
                      </TableCell>
                    </TableRow>

                    {/* Expenses */}
                    <TableRow
                      sx={{
                        bgcolor: COLORS.dangerSoft,
                      }}
                    >
                      <TableCell
                        sx={{
                          color: COLORS.danger,
                          fontWeight: 700,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        Expenses
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.danger,
                          fontWeight: 700,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(totalExpense)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          color: COLORS.text,
                          pl: 5,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        Purchase Expense
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(purchaseExpense)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          color: COLORS.text,
                          pl: 5,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        Other Expense
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                          py: 2,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {formatMoney(otherExpense)}
                      </TableCell>
                    </TableRow>

                    {/* Net Income */}
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
                          color: COLORS.text,
                          fontWeight: 800,
                          fontSize: "1rem",
                          py: 2.2,
                          borderTop: `2px solid ${COLORS.borderStrong}`,
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
                          borderTop: `2px solid ${COLORS.borderStrong}`,
                        }}
                      >
                        {formatMoney(netIncome)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Computation Note */}
            <Paper
              sx={{
                p: 2.5,
                bgcolor: "rgba(255,255,255,0.02)",
                border: `1px dashed ${COLORS.borderStrong}`,
                borderRadius: 2.5,
                boxShadow: "none",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.text,
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
                    color: COLORS.muted,
                    fontSize: "0.78rem",
                  }}
                >
                  • <b>Income:</b> Total of Income accounts
                  (Sales Revenue)
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.muted,
                    fontSize: "0.78rem",
                  }}
                >
                  • <b>Expenses:</b> Total of all expense
                  accounts
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.muted,
                    fontSize: "0.78rem",
                  }}
                >
                  • <b>Net Income:</b> Income − Expenses
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* ================= BALANCE SHEET ================= */}
        {tab === 1 && (
          <Stack spacing={4}>
            {balanceSheet.isLoading ? (
              <LoadingState label="Computing balance sheet..." />
            ) : balanceSheet.isError ? (
              <ErrorState
                message="Could not load balance sheet."
                onRetry={() => void balanceSheet.refetch()}
              />
            ) : (
              <Box
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 2.5,
                  overflow: "hidden",
                  bgcolor: COLORS.page,
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
                  {/* Assets */}
                  <Box
                    sx={{
                      borderRight: {
                        xs: "none",
                        md: `1px solid ${COLORS.border}`,
                      },
                      borderBottom: {
                        xs: `1px solid ${COLORS.border}`,
                        md: "none",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderBottom: `1px solid ${COLORS.border}`,
                        bgcolor: COLORS.infoSoft,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.info,
                          fontWeight: 700,
                          fontSize: "0.9rem",
                        }}
                        align="center"
                      >
                        Assets
                      </Typography>
                    </Box>

                    <Table size="small">
                      <TableBody>
                        {[
                          ["Bank", bankAsset],
                          ["Cash", cashAsset],
                          ["Debtors", debtorAsset],
                        ].map(([label, value]) => (
                          <TableRow key={label}>
                            <TableCell
                              sx={{
                                color: COLORS.text,
                                py: 2,
                                borderBottom: `1px solid ${COLORS.border}`,
                              }}
                            >
                              {label}
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                color: COLORS.text,
                                py: 2,
                                borderBottom: `1px solid ${COLORS.border}`,
                              }}
                            >
                              {formatMoney(value as number)}
                            </TableCell>
                          </TableRow>
                        ))}

                        {otherAssets > 0 && (
                          <TableRow>
                            <TableCell
                              sx={{
                                color: COLORS.muted,
                                py: 2,
                                borderBottom: `1px solid ${COLORS.border}`,
                              }}
                            >
                              Other Assets
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                color: COLORS.text,
                                py: 2,
                                borderBottom: `1px solid ${COLORS.border}`,
                              }}
                            >
                              {formatMoney(otherAssets)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    <Box
                      sx={{
                        p: 2.2,
                        borderTop: `2px solid ${COLORS.borderStrong}`,
                        bgcolor: "rgba(255,255,255,0.035)",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.text,
                          fontWeight: 800,
                        }}
                      >
                        Total Assets
                      </Typography>

                      <Typography
                        sx={{
                          color: COLORS.success,
                          fontWeight: 800,
                        }}
                      >
                        {formatMoney(
                          bData?.totals.assets || 0
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Liabilities & Capital */}
                  <Box>
                    <Box
                      sx={{
                        p: 2,
                        borderBottom: `1px solid ${COLORS.border}`,
                        bgcolor: COLORS.dangerSoft,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.danger,
                          fontWeight: 700,
                          fontSize: "0.9rem",
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
                              color: COLORS.text,
                              py: 2,
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}
                          >
                            Capital
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color: COLORS.text,
                              py: 2,
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}
                          >
                            {formatMoney(capitalEquity)}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell
                            sx={{
                              color: COLORS.text,
                              py: 2,
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}
                          >
                            Creditors
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color: COLORS.text,
                              py: 2,
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}
                          >
                            {formatMoney(creditorLiability)}
                          </TableCell>
                        </TableRow>

                        {otherLiabilities > 0 && (
                          <TableRow>
                            <TableCell
                              sx={{
                                color: COLORS.muted,
                                py: 2,
                                borderBottom: `1px solid ${COLORS.border}`,
                              }}
                            >
                              Other Liabilities
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                color: COLORS.text,
                                py: 2,
                                borderBottom: `1px solid ${COLORS.border}`,
                              }}
                            >
                              {formatMoney(otherLiabilities)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    <Box
                      sx={{
                        p: 2.2,
                        borderTop: `2px solid ${COLORS.borderStrong}`,
                        bgcolor: "rgba(255,255,255,0.035)",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography
                        sx={{
                          color: COLORS.text,
                          fontWeight: 800,
                        }}
                      >
                        Total Liabilities & Capital
                      </Typography>

                      <Typography
                        sx={{
                          color: COLORS.danger,
                          fontWeight: 800,
                        }}
                      >
                        {formatMoney(
                          (bData?.totals.liabilities || 0) +
                            capitalEquity
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Classification Note */}
            <Paper
              sx={{
                p: 2.5,
                bgcolor: "rgba(255,255,255,0.02)",
                border: `1px dashed ${COLORS.borderStrong}`,
                borderRadius: 2.5,
                boxShadow: "none",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.text,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  mb: 1.2,
                }}
              >
                Account Classifications
              </Typography>

              <Stack spacing={0.8}>
                <Typography
                  sx={{
                    color: COLORS.muted,
                    fontSize: "0.78rem",
                  }}
                >
                  • <b>Bank / Cash:</b> Asset accounts ·{" "}
                  <b>Debtors:</b> Asset accounts
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.muted,
                    fontSize: "0.78rem",
                  }}
                >
                  • <b>Creditors:</b> Liability accounts ·{" "}
                  <b>Capital:</b> Capital accounts
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* ================= BUDGET REPORT ================= */}
        {tab === 2 && (
          <Stack spacing={4}>
            {budgetReport.isLoading ? (
              <LoadingState label="Computing budget report..." />
            ) : budgetReport.isError ? (
              <ErrorState
                message="Could not load budget report."
                onRetry={() => void budgetReport.refetch()}
              />
            ) : (
              <TableContainer
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 2.5,
                  overflowX: "auto",
                  bgcolor: COLORS.page,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: COLORS.cardHover,
                      }}
                    >
                      {[
                        "Budget",
                        "Period",
                        "Analytic Account",
                        "Planned",
                        "Achieved",
                        "Remaining",
                      ].map((label, index) => (
                        <TableCell
                          key={label}
                          align={
                            index >= 3
                              ? "right"
                              : "left"
                          }
                          sx={{
                            color: COLORS.muted,
                            fontWeight: 700,
                            py: 2,
                            whiteSpace: "nowrap",
                            borderBottom: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {budgetReport.data?.data.map((b) => (
                      <TableRow
                        key={b.id}
                        sx={{
                          "&:hover": {
                            bgcolor: COLORS.cardHover,
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            color: COLORS.text,
                            fontWeight: 600,
                            py: 2,
                            borderBottom: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {b.name}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: COLORS.muted,
                            py: 2,
                            borderBottom: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {b.period}
                        </TableCell>

                        <TableCell
                          sx={{
                            py: 2,
                            borderBottom: `1px solid ${COLORS.border}`,
                          }}
                        >
                          <Chip
                            size="small"
                            label={b.analyticAccount}
                            sx={{
                              bgcolor: COLORS.accentSoft,
                              color: COLORS.accent,
                              border: `1px solid ${COLORS.border}`,
                              fontWeight: 600,
                              borderRadius: 1.5,
                            }}
                          />
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: COLORS.info,
                            fontWeight: 600,
                            py: 2,
                            borderBottom: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {formatMoney(b.plannedAmount)}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: COLORS.success,
                            fontWeight: 600,
                            py: 2,
                            borderBottom: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {formatMoney(b.achievedAmount)}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: COLORS.text,
                            fontWeight: 500,
                            py: 2,
                            borderBottom: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {formatMoney(b.remainingAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
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