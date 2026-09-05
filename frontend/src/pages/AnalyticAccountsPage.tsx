import { useState, type FormEvent } from "react";
import axios from "axios";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import * as api from "../api/analyticals.api";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";

const apiError = (error: unknown) =>
  axios.isAxiosError<{ error?: string }>(error)
    ? error.response?.data?.error ?? "Request failed."
    : "Request failed.";

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

export const AnalyticAccountsPage = () => {
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState<"list" | "form">("list");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<api.AnalyticType>("EXPENSE");
  const [validationError, setValidationError] = useState<string | null>(null);

  const analytics = useQuery({
    queryKey: ["analyticals", search],
    queryFn: () => api.getAnalytics({ search: search || undefined })
  });

  const save = useMutation({
    mutationFn: () => api.createAnalytic({ name, type }),
    onSuccess: () => {
      setScreen("list");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["analyticals"] });
    }
  });

  const openCreate = () => {
    setName("");
    setType("EXPENSE");
    setValidationError(null);
    setScreen("form");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      setValidationError("Analytic Account name must be at least 2 characters.");
      return;
    }
    setValidationError(null);
    save.mutate();
  };

  if (screen === "form") {
    return (
      <DarkContainer title="Analytic Accounts">
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

          <Stack spacing={3} maxWidth={600}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Analytic Account Name</Typography>
              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. Project Urban Expansion, IT Department"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={darkTextFieldSx}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={160}>Type</Typography>
              <TextField
                select
                SelectProps={darkSelectProps}
                variant="standard"
                fullWidth
                value={type}
                onChange={(e) => setType(e.target.value as api.AnalyticType)}
                sx={darkTextFieldSx}
              >
                <MenuItem value="INCOME">Income</MenuItem>
                <MenuItem value="EXPENSE">Expense</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedData = analytics.data?.data ?? [];

  return (
    <DarkContainer title="Analytic Accounts">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <CustomButton onClick={openCreate}>New</CustomButton>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search analytic account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: 300,
              input: { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&:hover fieldset": { borderColor: "white" }
              }
            }}
          />
          <Stack direction="row" spacing={2} alignItems="center">
            <CustomButton onClick={() => window.history.back()}>Back</CustomButton>
            <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, next) => next && setView(next)} sx={{ bgcolor: "white", borderRadius: 1 }}>
              <ToggleButton value="list"><ViewListIcon sx={{ color: "black" }} /></ToggleButton>
              <ToggleButton value="kanban"><ViewModuleIcon sx={{ color: "black" }} /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {analytics.isLoading ? (
          <LoadingState label="Loading analytic accounts..." />
        ) : analytics.isError ? (
          <ErrorState message={apiError(analytics.error)} onRetry={() => void analytics.refetch()} />
        ) : renderedData.length === 0 ? (
          <EmptyState message="No analytic accounts found. Click 'New' to create one." />
        ) : view === "list" ? (
          <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Name</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Type</TableCell>
                  <TableCell align="right" sx={{ color: "white", borderBottom: "none" }}>Linked Budgets</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderedData.map((item) => (
                  <TableRow key={item.id} hover sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <TableCell sx={{ color: "white", borderBottom: "none", fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell sx={{ borderBottom: "none" }}>
                      <Chip
                        size="small"
                        label={item.type === "INCOME" ? "Income" : "Expense"}
                        sx={{
                          bgcolor: item.type === "INCOME" ? "rgba(46, 125, 50, 0.2)" : "rgba(211, 47, 47, 0.2)",
                          color: item.type === "INCOME" ? "#81c784" : "#ff8a80"
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color: "rgba(255,255,255,0.7)", borderBottom: "none" }}>
                      {item._count?.budgets ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 3, pt: 2 }}>
            {renderedData.map((item) => (
              <Paper
                key={item.id}
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
                    <AccountTreeOutlinedIcon sx={{ color: "rgba(255,255,255,0.5)" }} />
                  </Box>
                  <Stack>
                    <Typography color="white" fontWeight={700}>{item.name}</Typography>
                    <Typography color="rgba(255,255,255,0.6)" variant="body2">{item.type}</Typography>
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
