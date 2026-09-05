import { useState, type FormEvent } from "react";
import axios from "axios";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import {
  Alert,
  Box,
  Button,
  MenuItem,
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
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/budgets.api";
import { getAnalytics } from "../api/analyticals.api";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";

const apiError = (error: unknown) =>
  axios.isAxiosError<{ error?: string }>(error)
    ? error.response?.data?.error ?? "Request failed."
    : "Request failed.";

const formatMoney = (amount: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(amount) || 0);

const DarkContainer = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pt: 4 }}>
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

const darkTextFieldSx = {
  "& .MuiInputBase-root": { color: "rgba(255,255,255,0.9)" },
  "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.3)" },
  "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottomColor: "rgba(255,255,255,0.7)" },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.6)" }
};

const darkSelectProps = {
  MenuProps: {
    PaperProps: {
      sx: {
        bgcolor: "#1e1e1e",
        color: "rgba(255,255,255,0.9)",
        maxHeight: 300,
        "& .MuiMenuItem-root:hover": { bgcolor: "rgba(255,255,255,0.1)" },
        "& .Mui-selected": { bgcolor: "rgba(255,255,255,0.2) !important" }
      }
    }
  }
};

const CustomButton = ({ children, active, ...props }: any) => (
  <Button
    variant="outlined"
    sx={{
      color: active ? "black" : "white",
      bgcolor: active ? "white" : "transparent",
      borderColor: "rgba(255,255,255,0.5)",
      borderRadius: 2,
      textTransform: "none",
      minWidth: 80,
      "&:hover": { bgcolor: active ? "white" : "rgba(255,255,255,0.1)", borderColor: "white" }
    }}
    {...props}
  >
    {children}
  </Button>
);

export const BudgetsPage = () => {
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState<"list" | "form">("list");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("2026-Q1");
  const [plannedAmount, setPlannedAmount] = useState<number>(50000);
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [analyticAccountId, setAnalyticAccountId] = useState<number | "">("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const budgets = useQuery({ queryKey: ["budgets"], queryFn: () => api.getBudgets() });
  const analytics = useQuery({ queryKey: ["analyticals-for-budget"], queryFn: () => getAnalytics() });

  const save = useMutation({
    mutationFn: () =>
      api.createBudget({
        name,
        period,
        plannedAmount: Number(plannedAmount),
        responsiblePerson,
        analyticAccountId: Number(analyticAccountId)
      }),
    onSuccess: () => {
      setScreen("list");
      setName("");
      setResponsiblePerson("");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    }
  });

  const openCreate = () => {
    setName("");
    setPeriod("2026-Q1");
    setPlannedAmount(50000);
    setResponsiblePerson("");
    setAnalyticAccountId(analytics.data?.data[0]?.id || "");
    setValidationError(null);
    setScreen("form");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      setValidationError("Budget Name is required.");
      return;
    }
    if (!responsiblePerson || responsiblePerson.trim().length < 2) {
      setValidationError("Responsible Person is required.");
      return;
    }
    if (!analyticAccountId) {
      setValidationError("Please select an Analytic Account.");
      return;
    }
    if (plannedAmount <= 0) {
      setValidationError("Planned amount must be greater than zero.");
      return;
    }
    setValidationError(null);
    save.mutate();
  };

  if (screen === "form") {
    return (
      <DarkContainer title="Budgets">
        <Stack component="form" onSubmit={submit} spacing={4}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2}>
              <CustomButton type="submit" disabled={save.isPending}>
                {save.isPending ? "..." : "Confirm"}
              </CustomButton>
            </Stack>
            <CustomButton onClick={() => setScreen("list")}>Back</CustomButton>
          </Stack>

          {validationError && <Alert severity="warning">{validationError}</Alert>}
          {save.isError && <Alert severity="error">{apiError(save.error)}</Alert>}

          <Stack spacing={3} maxWidth={650}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Budget Name</Typography>
              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. Q1 Marketing & Office Operations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={darkTextFieldSx}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Period</Typography>
              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. 2026-Q1, 2026-Annual"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                sx={darkTextFieldSx}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Responsible Person</Typography>
              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. Rahul Sharma"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                required
                sx={darkTextFieldSx}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Analytic Account</Typography>
              <TextField
                select
                SelectProps={darkSelectProps}
                variant="standard"
                fullWidth
                value={analyticAccountId}
                onChange={(e) => setAnalyticAccountId(Number(e.target.value))}
                required
                sx={darkTextFieldSx}
              >
                <MenuItem value="" disabled>Select Analytic Account</MenuItem>
                {analytics.data?.data.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.name} ({a.type})</MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Planned Amount (Rs.)</Typography>
              <TextField
                type="number"
                variant="standard"
                fullWidth
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(Number(e.target.value))}
                required
                sx={darkTextFieldSx}
              />
            </Stack>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedBudgets = budgets.data?.data ?? [];

  return (
    <DarkContainer title="Budgets">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <CustomButton onClick={openCreate}>New</CustomButton>
          <Stack direction="row" spacing={2} alignItems="center">
            <CustomButton onClick={() => window.history.back()}>Back</CustomButton>
            <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, next) => next && setView(next)} sx={{ bgcolor: "white", borderRadius: 1 }}>
              <ToggleButton value="list"><ViewListIcon sx={{ color: "black" }} /></ToggleButton>
              <ToggleButton value="kanban"><ViewModuleIcon sx={{ color: "black" }} /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {budgets.isLoading ? (
          <LoadingState label="Loading budgets..." />
        ) : budgets.isError ? (
          <ErrorState message={apiError(budgets.error)} onRetry={() => void budgets.refetch()} />
        ) : renderedBudgets.length === 0 ? (
          <EmptyState message="No budgets created yet. Click 'New' to define a budget." />
        ) : view === "list" ? (
          <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Budget Name</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Period</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Responsible</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Analytic Account</TableCell>
                  <TableCell align="right" sx={{ color: "white", borderBottom: "none" }}>Planned Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderedBudgets.map((b) => (
                  <TableRow key={b.id} hover sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <TableCell sx={{ color: "white", borderBottom: "none", fontWeight: 600 }}>{b.name}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderBottom: "none" }}>{b.period}</TableCell>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>{b.responsiblePerson}</TableCell>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>{b.analyticAccount?.name}</TableCell>
                    <TableCell align="right" sx={{ color: "#90caf9", borderBottom: "none", fontWeight: 700 }}>
                      {formatMoney(b.plannedAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 3, pt: 2 }}>
            {renderedBudgets.map((b) => (
              <Paper
                key={b.id}
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "transparent",
                  borderColor: "rgba(255,255,255,0.3)",
                  borderRadius: 3
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 50, height: 50, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AccountBalanceWalletOutlinedIcon sx={{ color: "rgba(255,255,255,0.5)" }} />
                  </Box>
                  <Stack>
                    <Typography color="white" fontWeight={700}>{b.name}</Typography>
                    <Typography color="rgba(255,255,255,0.6)" variant="body2">{b.period} · {b.responsiblePerson}</Typography>
                    <Typography color="#90caf9" fontWeight={600} variant="body2">{formatMoney(b.plannedAmount)}</Typography>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </Stack>
    </DarkContainer>
  );
};
