import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/journals.api";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";

const money = (value: string | number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value) || 0);

const DarkContainer = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pt: 4, pb: 6 }}>
    {title && (
      <Box sx={{ bgcolor: "#3c3800", border: "1px solid #7a7300", borderRadius: 2, py: 1, px: 3, mb: 3, display: "inline-block" }}>
        <Typography variant="h6" color="#90EE90" fontWeight={600}>
          {title}
        </Typography>
      </Box>
    )}
    <Box sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, p: 3, bgcolor: "#121212" }}>
      {children}
    </Box>
  </Box>
);

export const JournalEntryDetailsPage = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const cache = useQueryClient();
  const { user } = useAuth();

  const entry = useQuery({
    queryKey: ["journal-entry", id],
    queryFn: () => api.getEntry(Number(id)),
    enabled: Boolean(id)
  });

  const post = useMutation({
    mutationFn: () => api.postEntry(Number(id)),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["journal-entry", id] });
      cache.invalidateQueries({ queryKey: ["journal-entries"] });
    }
  });

  if (entry.isLoading) return <LoadingState label="Loading journal entry..." />;
  if (entry.isError || !entry.data)
    return <ErrorState message="Journal entry could not be loaded." onRetry={() => void entry.refetch()} />;

  const e = entry.data;
  const totalDebit = e.lines!.reduce((sum, line) => sum + Number(line.debit), 0);
  const totalCredit = e.lines!.reduce((sum, line) => sum + Number(line.credit), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const canPost = ["Admin", "Accountant"].includes(user?.role ?? "") && e.status === "DRAFT";

  return (
    <DarkContainer title={`Journal Entry: ${e.entryNumber}`}>
      <Stack spacing={3}>
        {/* Header Actions */}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" gap={2}>
          <Box>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              {e.journal.name} · {new Date(e.entryDate).toLocaleDateString()}
            </Typography>
          </Box>
          <Stack direction="row" gap={1.5}>
            <Chip
              label={e.status}
              sx={{
                bgcolor: e.status === "POSTED" ? "rgba(46, 125, 50, 0.2)" : "rgba(237, 108, 2, 0.2)",
                color: e.status === "POSTED" ? "#90EE90" : "#ffb74d",
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            />
            {canPost && (
              <Button
                variant="contained"
                disabled={post.isPending || !isBalanced}
                onClick={() => post.mutate()}
                startIcon={<CheckCircleOutlineIcon />}
                sx={{
                  bgcolor: "#2B5E74",
                  color: "white",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#1f4759" }
                }}
              >
                {post.isPending ? "Posting..." : "Post Entry"}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => nav("/journal-entries")}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.3)",
                borderRadius: 2,
                textTransform: "none",
                "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.05)" }
              }}
            >
              Back
            </Button>
          </Stack>
        </Stack>

        {post.isError && (
          <Alert severity="error" sx={{ bgcolor: "rgba(211,47,47,0.2)", color: "#ffb4ab" }}>
            Could not post this entry. Check active accounts and balance.
          </Alert>
        )}

        {/* Info Card */}
        <Box sx={{ bgcolor: "#161616", p: 2.5, borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)" }}>
          <Stack spacing={1}>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              <strong style={{ color: "white" }}>Reference:</strong>{" "}
              {e.referenceType && e.referenceId ? `${e.referenceType} · ${e.referenceId}` : "Manual General Journal entry"}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              <strong style={{ color: "white" }}>Description:</strong> {e.description ?? "—"}
            </Typography>
          </Stack>
        </Box>

        {/* Line Items Table */}
        <TableContainer sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)", bgcolor: "#121212" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#181818" }}>
              <TableRow>
                <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Account</TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Description</TableCell>
                <TableCell align="right" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Debit (₹)</TableCell>
                <TableCell align="right" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Credit (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {e.lines!.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Typography fontWeight={600} color="#90EE90">
                      {line.account.code} - {line.account.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.85)" }}>
                    {line.description ?? "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#ffffff", fontWeight: 500 }}>
                    {Number(line.debit) ? money(line.debit) : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#ffffff", fontWeight: 500 }}>
                    {Number(line.credit) ? money(line.credit) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: "rgba(255,255,255,0.05)" }}>
                <TableCell colSpan={2}>
                  <Typography fontWeight={800} color="white">
                    Totals
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={800} color="#90EE90">
                    {money(totalDebit)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={800} color="#90EE90">
                    {money(totalCredit)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Alert
          severity={isBalanced ? "success" : "error"}
          sx={{
            bgcolor: isBalanced ? "rgba(46, 125, 50, 0.15)" : "rgba(211, 47, 47, 0.15)",
            color: isBalanced ? "#90EE90" : "#ffb4ab",
            border: "1px solid rgba(255,255,255,0.1)",
            "& .MuiAlert-icon": { color: isBalanced ? "#90EE90" : "#ffb4ab" }
          }}
        >
          Double-entry validation: Total Debit ({money(totalDebit)}) {isBalanced ? "EQUALS" : "DOES NOT EQUAL"} Total Credit ({money(totalCredit)}).
        </Alert>
      </Stack>
    </DarkContainer>
  );
};
