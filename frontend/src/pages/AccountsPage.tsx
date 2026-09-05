import { useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as accountsApi from "../api/accounts.api";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";

const blank: accountsApi.AccountInput = {
  code: "",
  name: "",
  type: "ASSET",
  parentId: null
};

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

const displayType = (type: string) => {
  if (type === "REVENUE" || type === "INCOME") return "Income";
  if (type === "EXPENSE") return "Expenses";
  if (type === "EQUITY" || type === "CAPITAL") return "Capital";
  if (type === "LIABILITY") return "Liability";
  return "Asset";
};

export const AccountsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = ["Admin", "Accountant"].includes(user?.role ?? "");

  const [screen, setScreen] = useState<"list" | "form">("list");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<accountsApi.AccountInput>(blank);
  const [editing, setEditing] = useState<accountsApi.Account | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const params = useMemo(() => ({ search: search || undefined, page, pageSize: 25 }), [search, page]);
  const accounts = useQuery({ queryKey: ["accounts", params], queryFn: () => accountsApi.getAccounts(params) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["accounts"] });

  const save = useMutation({
    mutationFn: (payload: accountsApi.AccountInput) =>
      editing ? accountsApi.updateAccount({ id: editing.id, input: payload }) : accountsApi.createAccount(payload),
    onSuccess: () => {
      setScreen("list");
      setEditing(null);
      setForm(blank);
      refresh();
    }
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...blank, code: `ACC-${Math.floor(1000 + Math.random() * 9000)}` });
    setValidationError(null);
    setScreen("form");
  };

  const openRecord = (acc: accountsApi.Account) => {
    setEditing(acc);
    setForm({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      parentId: acc.parentId
    });
    setValidationError(null);
    setScreen("form");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || form.name.trim().length < 2) {
      setValidationError("Account Name must be at least 2 characters long.");
      return;
    }
    setValidationError(null);
    save.mutate(form);
  };

  if (screen === "form") {
    return (
      <DarkContainer title="Chart of Accounts">
        <Stack component="form" onSubmit={submit} spacing={4}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2}>
              <CustomButton type="submit" disabled={save.isPending}>
                {save.isPending ? "..." : "Confirm"}
              </CustomButton>
            </Stack>
            <CustomButton onClick={() => { setScreen("list"); setEditing(null); }}>
              Back
            </CustomButton>
          </Stack>

          {validationError && <Alert severity="warning">{validationError}</Alert>}
          {save.isError && <Alert severity="error">{apiError(save.error)}</Alert>}

          <Stack spacing={3} maxWidth={600}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={140}>Account Name</Typography>
              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. Bank A/c, Debtors A/c"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                sx={darkTextFieldSx}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={140}>Type</Typography>
              <TextField
                select
                SelectProps={darkSelectProps}
                variant="standard"
                fullWidth
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as accountsApi.AccountType })}
                sx={darkTextFieldSx}
              >
                <MenuItem value="ASSET">Asset</MenuItem>
                <MenuItem value="LIABILITY">Liability</MenuItem>
                <MenuItem value="REVENUE">Income</MenuItem>
                <MenuItem value="EXPENSE">Expenses</MenuItem>
                <MenuItem value="EQUITY">Capital</MenuItem>
              </TextField>
            </Stack>

            <Typography variant="body2" color="rgba(255,255,255,0.4)">
              Each account is assigned an Account Type, which is used for financial reporting (Balance Sheet and Profit & Loss).
            </Typography>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedAccounts = accounts.data?.data ?? [];

  return (
    <DarkContainer title="Chart of Accounts">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <CustomButton onClick={openCreate}>New</CustomButton>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search account..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            sx={{
              width: 300,
              input: { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&:hover fieldset": { borderColor: "white" }
              }
            }}
          />
          <CustomButton onClick={() => window.history.back()}>Back</CustomButton>
        </Stack>

        {accounts.isLoading ? (
          <LoadingState label="Loading chart of accounts..." />
        ) : accounts.isError ? (
          <ErrorState message={apiError(accounts.error)} onRetry={() => void accounts.refetch()} />
        ) : renderedAccounts.length === 0 ? (
          <EmptyState message="No accounts found." />
        ) : (
          <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Account Name</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Code</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderedAccounts.map((acc) => (
                  <TableRow
                    key={acc.id}
                    hover
                    onClick={() => openRecord(acc)}
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <TableCell sx={{ color: "white", borderBottom: "none", fontWeight: 600 }}>
                      {acc.name}
                    </TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderBottom: "none" }}>
                      {acc.code}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "none" }}>
                      <Chip
                        size="small"
                        label={displayType(acc.type)}
                        sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "white" }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="rgba(255,255,255,0.5)">
            {accounts.data?.meta.total ?? 0} accounts
          </Typography>
          <Pagination
            page={page}
            count={Math.max(1, accounts.data?.meta.totalPages ?? 1)}
            onChange={(_, value) => setPage(value)}
            sx={{ "& .MuiPaginationItem-root": { color: "white" } }}
          />
        </Box>
      </Stack>
    </DarkContainer>
  );
};
