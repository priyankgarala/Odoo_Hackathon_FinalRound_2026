import { useState, type FormEvent } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
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
import * as journalsApi from "../api/journals.api";
import { getAccounts } from "../api/accounts.api";
import { getContacts } from "../api/contacts.api";
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

type FormLine = {
  accountId: number | "";
  partnerId: number | "";
  debit: number;
  credit: number;
};

export const JournalEntriesPage = () => {
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState<"list" | "form">("list");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Form State
  const [journalId, setJournalId] = useState<number | "">("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<FormLine[]>([
    { accountId: "", partnerId: "", debit: 0, credit: 0 },
    { accountId: "", partnerId: "", debit: 0, credit: 0 }
  ]);

  const journals = useQuery({ queryKey: ["journals"], queryFn: journalsApi.getJournals });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: () => getAccounts({ page: 1, pageSize: 100 }) });
  const contacts = useQuery({ queryKey: ["contacts-simple"], queryFn: () => getContacts({ page: 1, pageSize: 100 }) });
  const entries = useQuery({
    queryKey: ["journal-entries", search, page],
    queryFn: () => journalsApi.getEntries({ search: search || undefined, page, pageSize: 15 })
  });

  const save = useMutation({
    mutationFn: (postNow: boolean) =>
      journalsApi.createEntry({
        journalId: Number(journalId),
        entryDate,
        description: description || null,
        postNow,
        lines: lines.map((l) => ({
          accountId: Number(l.accountId),
          partnerId: l.partnerId ? Number(l.partnerId) : null,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0
        }))
      }),
    onSuccess: () => {
      setScreen("list");
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    }
  });

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalCredit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;
  const hasInvalidLines = lines.some((l) => !l.accountId || (l.debit === 0 && l.credit === 0));

  const updateLine = (idx: number, patch: Partial<FormLine>) => {
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => {
    setLines([...lines, { accountId: "", partnerId: "", debit: 0, credit: 0 }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const openCreate = () => {
    setJournalId(journals.data?.[0]?.id || "");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setLines([
      { accountId: "", partnerId: "", debit: 0, credit: 0 },
      { accountId: "", partnerId: "", debit: 0, credit: 0 }
    ]);
    setScreen("form");
  };

  if (screen === "form") {
    return (
      <DarkContainer title="Journal Entries">
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2}>
              <CustomButton
                disabled={!isBalanced || !journalId || hasInvalidLines || save.isPending}
                onClick={() => save.mutate(true)}
              >
                {save.isPending ? "..." : "Post"}
              </CustomButton>
              <CustomButton onClick={() => setScreen("list")}>Cancel</CustomButton>
            </Stack>
            <CustomButton onClick={() => setScreen("list")}>Back</CustomButton>
          </Stack>

          {save.isError && <Alert severity="error">{apiError(save.error)}</Alert>}

          {/* Blocking Warning per wireframe */}
          {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
            <Alert severity="error" sx={{ bgcolor: "rgba(211, 47, 47, 0.15)", color: "#ff8a80", border: "1px solid #d32f2f" }}>
              Blocking warning: Total Debit ({formatMoney(totalDebit)}) and Total Credit ({formatMoney(totalCredit)}) do not match.
            </Alert>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={4} sx={{ pt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} flex={1}>
              <Typography color="white" minWidth={130}>Accounting Date</Typography>
              <TextField
                type="date"
                variant="standard"
                fullWidth
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                sx={darkTextFieldSx}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2} flex={1}>
              <Typography color="white" minWidth={80}>Journal</Typography>
              <TextField
                select
                SelectProps={darkSelectProps}
                variant="standard"
                fullWidth
                value={journalId}
                onChange={(e) => setJournalId(Number(e.target.value))}
                sx={darkTextFieldSx}
              >
                {journals.data?.map((j) => (
                  <MenuItem key={j.id} value={j.id}>{j.name} ({j.type})</MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>

          <TextField
            variant="standard"
            label="Reference / Description"
            placeholder="e.g. Office supplies purchase"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={darkTextFieldSx}
          />

          {/* Lines Table */}
          <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2, mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Account</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Partner</TableCell>
                  <TableCell align="right" sx={{ color: "white", borderBottom: "none", width: 140 }}>Debit (Rs.)</TableCell>
                  <TableCell align="right" sx={{ color: "white", borderBottom: "none", width: 140 }}>Credit (Rs.)</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none", width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((l, idx) => (
                  <TableRow key={idx} sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <TableCell sx={{ borderBottom: "none" }}>
                      <TextField
                        select
                        SelectProps={darkSelectProps}
                        variant="standard"
                        fullWidth
                        value={l.accountId}
                        onChange={(e) => updateLine(idx, { accountId: Number(e.target.value) })}
                        sx={darkTextFieldSx}
                      >
                        <MenuItem value="" disabled>Select Account</MenuItem>
                        {accounts.data?.data.map((acc) => (
                          <MenuItem key={acc.id} value={acc.id}>{acc.name} ({acc.code})</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "none" }}>
                      <TextField
                        select
                        SelectProps={darkSelectProps}
                        variant="standard"
                        fullWidth
                        value={l.partnerId}
                        onChange={(e) => updateLine(idx, { partnerId: e.target.value ? Number(e.target.value) : "" })}
                        sx={darkTextFieldSx}
                      >
                        <MenuItem value="">None</MenuItem>
                        {contacts.data?.data.map((c) => (
                          <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: "none" }}>
                      <TextField
                        type="number"
                        variant="standard"
                        value={l.debit || ""}
                        placeholder="0.00"
                        onChange={(e) => updateLine(idx, { debit: Number(e.target.value) || 0, credit: 0 })}
                        sx={darkTextFieldSx}
                        inputProps={{ style: { textAlign: "right" } }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: "none" }}>
                      <TextField
                        type="number"
                        variant="standard"
                        value={l.credit || ""}
                        placeholder="0.00"
                        onChange={(e) => updateLine(idx, { credit: Number(e.target.value) || 0, debit: 0 })}
                        sx={darkTextFieldSx}
                        inputProps={{ style: { textAlign: "right" } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: "none" }}>
                      <IconButton
                        size="small"
                        disabled={lines.length <= 2}
                        onClick={() => removeLine(idx)}
                        sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "red" } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              startIcon={<AddIcon />}
              onClick={addLine}
              sx={{ color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.3)", textTransform: "none" }}
              variant="outlined"
            >
              Add Line
            </Button>
            <Stack direction="row" spacing={3}>
              <Typography color={isBalanced ? "#81c784" : "white"}>
                Total Debit: <b>{formatMoney(totalDebit)}</b>
              </Typography>
              <Typography color={isBalanced ? "#81c784" : "white"}>
                Total Credit: <b>{formatMoney(totalCredit)}</b>
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedEntries = entries.data?.data ?? [];

  return (
    <DarkContainer title="Journal Entries">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <CustomButton onClick={openCreate}>New</CustomButton>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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

        {entries.isLoading ? (
          <LoadingState label="Loading journal entries..." />
        ) : entries.isError ? (
          <ErrorState message={apiError(entries.error)} onRetry={() => void entries.refetch()} />
        ) : renderedEntries.length === 0 ? (
          <EmptyState message="No journal entries found." />
        ) : (
          <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Date</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Number</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Partner</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Journal</TableCell>
                  <TableCell align="right" sx={{ color: "white", borderBottom: "none" }}>Total</TableCell>
                  <TableCell sx={{ color: "white", borderBottom: "none" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderedEntries.map((e) => {
                  const partnerName = e.lines?.find((l) => l.partner)?.partner?.name || "—";
                  const totalAmount = e.lines?.reduce((sum, l) => sum + Number(l.debit), 0) || 0;
                  return (
                    <TableRow
                      key={e.id}
                      hover
                      component={RouterLink}
                      to={`/journal-entries/${e.id}`}
                      sx={{ textDecoration: "none", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <TableCell sx={{ color: "white", borderBottom: "none" }}>
                        {new Date(e.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell sx={{ color: "#90caf9", borderBottom: "none", fontWeight: 600 }}>
                        {e.entryNumber}
                      </TableCell>
                      <TableCell sx={{ color: "white", borderBottom: "none" }}>
                        {partnerName}
                      </TableCell>
                      <TableCell sx={{ color: "white", borderBottom: "none" }}>
                        {e.journal.name}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "white", borderBottom: "none", fontWeight: 600 }}>
                        {formatMoney(totalAmount)}
                      </TableCell>
                      <TableCell sx={{ borderBottom: "none" }}>
                        <Chip
                          size="small"
                          label={e.status}
                          sx={{
                            bgcolor: e.status === "POSTED" ? "rgba(46, 125, 50, 0.2)" : "rgba(255, 255, 255, 0.12)",
                            color: e.status === "POSTED" ? "#81c784" : "white"
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="rgba(255,255,255,0.5)">
            {entries.data?.meta.total ?? 0} entries
          </Typography>
          <Pagination
            page={page}
            count={Math.max(1, entries.data?.meta.totalPages ?? 1)}
            onChange={(_, value) => setPage(value)}
            sx={{ "& .MuiPaginationItem-root": { color: "white" } }}
          />
        </Box>
      </Stack>
    </DarkContainer>
  );
};
