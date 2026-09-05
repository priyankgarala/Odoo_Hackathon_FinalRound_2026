import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
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
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/reports.api";
import { LoadingState } from "../components/feedback/LoadingState";
import { ErrorState } from "../components/feedback/ErrorState";

const formatMoney = (amount: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(amount) || 0);

const DarkContainer = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <Box sx={{ width: "100%", maxWidth: 1050, mx: "auto", pt: 4 }}>
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

export const ReportsPage = ({ initialTab = 0 }: { initialTab?: number }) => {
  const [tab, setTab] = useState(initialTab);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  const balanceSheet = useQuery({
    queryKey: ["report-balance-sheet", asOfDate],
    queryFn: () => api.getBalanceSheet(asOfDate)
  });

  const profitLoss = useQuery({
    queryKey: ["report-profit-loss"],
    queryFn: () => api.getProfitLoss()
  });

  const budgetReport = useQuery({
    queryKey: ["report-budget"],
    queryFn: () => api.getBudgetReport()
  });

  return (
    <DarkContainer title="Financial & Management Reports">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              "& .MuiTab-root": { color: "rgba(255,255,255,0.7)", textTransform: "none", fontSize: "1rem" },
              "& .Mui-selected": { color: "#90EE90", fontWeight: 700 }
            }}
          >
            <Tab label="Balance Sheet" />
            <Tab label="Profit & Loss" />
            <Tab label="Budget Report" />
          </Tabs>

          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", textTransform: "none" }}
          >
            Back
          </Button>
        </Stack>

        {/* Tab 0: Balance Sheet */}
        {tab === 0 && (
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" color="white" fontWeight={700}>
                Balance Sheet
              </Typography>
              <TextField
                type="date"
                size="small"
                label="As of Date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                sx={{
                  input: { color: "white" },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                  "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.3)" } }
                }}
              />
            </Stack>

            {balanceSheet.isLoading ? (
              <LoadingState label="Computing balance sheet..." />
            ) : balanceSheet.isError ? (
              <ErrorState message="Could not load balance sheet." onRetry={() => void balanceSheet.refetch()} />
            ) : (
              <Stack spacing={3}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
                  <Card sx={{ bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2 }}>
                    <CardContent>
                      <Typography color="rgba(255,255,255,0.6)" variant="body2">TOTAL ASSETS</Typography>
                      <Typography variant="h5" color="#81c784" fontWeight={700}>
                        {formatMoney(balanceSheet.data?.totals.assets || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2 }}>
                    <CardContent>
                      <Typography color="rgba(255,255,255,0.6)" variant="body2">TOTAL LIABILITIES</Typography>
                      <Typography variant="h5" color="#ff8a80" fontWeight={700}>
                        {formatMoney(balanceSheet.data?.totals.liabilities || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2 }}>
                    <CardContent>
                      <Typography color="rgba(255,255,255,0.6)" variant="body2">TOTAL CAPITAL / EQUITY</Typography>
                      <Typography variant="h5" color="#90caf9" fontWeight={700}>
                        {formatMoney(balanceSheet.data?.totals.capital || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* Assets Table */}
                <Box>
                  <Typography variant="h6" color="#81c784" sx={{ mb: 1 }}>Assets</Typography>
                  <TableContainer component={Paper} sx={{ bgcolor: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "white" }}>Account</TableCell>
                          <TableCell sx={{ color: "white" }}>Code</TableCell>
                          <TableCell align="right" sx={{ color: "white" }}>Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {balanceSheet.data?.assets.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell sx={{ color: "white" }}>{a.name}</TableCell>
                            <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{a.code}</TableCell>
                            <TableCell align="right" sx={{ color: "white", fontWeight: 600 }}>{formatMoney(a.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Liabilities Table */}
                <Box>
                  <Typography variant="h6" color="#ff8a80" sx={{ mb: 1 }}>Liabilities</Typography>
                  <TableContainer component={Paper} sx={{ bgcolor: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "white" }}>Account</TableCell>
                          <TableCell sx={{ color: "white" }}>Code</TableCell>
                          <TableCell align="right" sx={{ color: "white" }}>Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {balanceSheet.data?.liabilities.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell sx={{ color: "white" }}>{l.name}</TableCell>
                            <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{l.code}</TableCell>
                            <TableCell align="right" sx={{ color: "white", fontWeight: 600 }}>{formatMoney(l.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Capital Table */}
                <Box>
                  <Typography variant="h6" color="#90caf9" sx={{ mb: 1 }}>Capital / Equity</Typography>
                  <TableContainer component={Paper} sx={{ bgcolor: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "white" }}>Account</TableCell>
                          <TableCell sx={{ color: "white" }}>Code</TableCell>
                          <TableCell align="right" sx={{ color: "white" }}>Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {balanceSheet.data?.capital.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell sx={{ color: "white" }}>{c.name}</TableCell>
                            <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{c.code}</TableCell>
                            <TableCell align="right" sx={{ color: "white", fontWeight: 600 }}>{formatMoney(c.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            )}
          </Stack>
        )}

        {/* Tab 1: Profit & Loss */}
        {tab === 1 && (
          <Stack spacing={3}>
            <Typography variant="h5" color="white" fontWeight={700}>
              Profit & Loss (P&L) Statement
            </Typography>

            {profitLoss.isLoading ? (
              <LoadingState label="Computing profit and loss..." />
            ) : profitLoss.isError ? (
              <ErrorState message="Could not load profit and loss." onRetry={() => void profitLoss.refetch()} />
            ) : (
              <Stack spacing={3}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
                  <Card sx={{ bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2 }}>
                    <CardContent>
                      <Typography color="rgba(255,255,255,0.6)" variant="body2">TOTAL REVENUE (INCOME)</Typography>
                      <Typography variant="h5" color="#81c784" fontWeight={700}>
                        {formatMoney(profitLoss.data?.totals.totalIncome || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2 }}>
                    <CardContent>
                      <Typography color="rgba(255,255,255,0.6)" variant="body2">TOTAL PURCHASES & EXPENSES</Typography>
                      <Typography variant="h5" color="#ff8a80" fontWeight={700}>
                        {formatMoney(profitLoss.data?.totals.totalExpense || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2 }}>
                    <CardContent>
                      <Typography color="rgba(255,255,255,0.6)" variant="body2">NET PROFIT / (LOSS)</Typography>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        color={(profitLoss.data?.totals.netProfit ?? 0) < 0 ? "#ff8a80" : "#81c784"}
                      >
                        {formatMoney(profitLoss.data?.totals.netProfit || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* Income details */}
                <Box>
                  <Typography variant="h6" color="#81c784" sx={{ mb: 1 }}>Income / Sales Revenue</Typography>
                  <TableContainer component={Paper} sx={{ bgcolor: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "white" }}>Account</TableCell>
                          <TableCell sx={{ color: "white" }}>Code</TableCell>
                          <TableCell align="right" sx={{ color: "white" }}>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {profitLoss.data?.income.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell sx={{ color: "white" }}>{i.name}</TableCell>
                            <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{i.code}</TableCell>
                            <TableCell align="right" sx={{ color: "white", fontWeight: 600 }}>{formatMoney(i.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Expense details */}
                <Box>
                  <Typography variant="h6" color="#ff8a80" sx={{ mb: 1 }}>Expenses / Purchases</Typography>
                  <TableContainer component={Paper} sx={{ bgcolor: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "white" }}>Account</TableCell>
                          <TableCell sx={{ color: "white" }}>Code</TableCell>
                          <TableCell align="right" sx={{ color: "white" }}>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {profitLoss.data?.expenses.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell sx={{ color: "white" }}>{e.name}</TableCell>
                            <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{e.code}</TableCell>
                            <TableCell align="right" sx={{ color: "white", fontWeight: 600 }}>{formatMoney(e.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            )}
          </Stack>
        )}

        {/* Tab 2: Budget Report */}
        {tab === 2 && (
          <Stack spacing={3}>
            <Typography variant="h5" color="white" fontWeight={700}>
              Budget Report (Planned vs. Actual)
            </Typography>

            {budgetReport.isLoading ? (
              <LoadingState label="Computing budget report..." />
            ) : budgetReport.isError ? (
              <ErrorState message="Could not load budget report." onRetry={() => void budgetReport.refetch()} />
            ) : (
              <Stack spacing={3}>
                <TableContainer component={Paper} sx={{ bgcolor: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "white" }}>Budget</TableCell>
                        <TableCell sx={{ color: "white" }}>Period</TableCell>
                        <TableCell sx={{ color: "white" }}>Analytic Account</TableCell>
                        <TableCell align="right" sx={{ color: "white" }}>Planned</TableCell>
                        <TableCell align="right" sx={{ color: "white" }}>Achieved</TableCell>
                        <TableCell sx={{ color: "white", width: 180 }}>Progress</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {budgetReport.data?.data.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell sx={{ color: "white", fontWeight: 600 }}>{b.name}</TableCell>
                          <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>{b.period}</TableCell>
                          <TableCell sx={{ color: "white" }}>
                            <Chip size="small" label={b.analyticAccount} sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "white" }} />
                          </TableCell>
                          <TableCell align="right" sx={{ color: "#90caf9", fontWeight: 600 }}>{formatMoney(b.plannedAmount)}</TableCell>
                          <TableCell align="right" sx={{ color: "#81c784", fontWeight: 600 }}>{formatMoney(b.achievedAmount)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={b.percentage}
                                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption" color="white">{b.percentage}%</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </DarkContainer>
  );
};
