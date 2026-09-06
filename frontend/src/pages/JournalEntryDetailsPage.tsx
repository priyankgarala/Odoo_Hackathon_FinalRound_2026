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
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/journals.api";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";
import { isSystemAdministrator } from "../features/auth/roles";

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

const money = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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
      pt: 4,
      pb: 6,
    }}
  >
    {title && (
      <Box
        sx={{
          bgcolor: COLORS.accentSoft,
          border: `1px solid ${COLORS.borderStrong}`,
          borderRadius: 2,
          py: 1.25,
          px: 3,
          mb: 3,
          display: "inline-block",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: COLORS.accent,
            fontWeight: 700,
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
        p: { xs: 2, sm: 3 },
        bgcolor: COLORS.card,
      }}
    >
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
    enabled: Boolean(id),
  });

  const post = useMutation({
    mutationFn: () => api.postEntry(Number(id)),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["journal-entry", id] });
      cache.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });

  if (entry.isLoading) {
    return <LoadingState label="Loading journal entry..." />;
  }

  if (entry.isError || !entry.data) {
    return (
      <ErrorState
        message="Journal entry could not be loaded."
        onRetry={() => void entry.refetch()}
      />
    );
  }

  const e = entry.data;

  const totalDebit =
    e.lines?.reduce((sum, line) => sum + Number(line.debit), 0) ?? 0;

  const totalCredit =
    e.lines?.reduce((sum, line) => sum + Number(line.credit), 0) ?? 0;

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const canPost =
    isSystemAdministrator(user?.role) && e.status === "DRAFT";

  const isPosted = e.status === "POSTED";

  return (
    <DarkContainer title={`Journal Entry: ${e.entryNumber}`}>
      <Stack spacing={4}>
        {/* Header Actions */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          gap={2}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.muted,
                fontSize: "0.9rem",
              }}
            >
              {e.journal.name} ·{" "}
              {new Date(e.entryDate).toLocaleDateString()}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            gap={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Chip
              label={e.status}
              sx={{
                bgcolor: isPosted
                  ? COLORS.successSoft
                  : COLORS.warningSoft,
                color: isPosted ? COLORS.success : COLORS.warning,
                fontWeight: 700,
                border: `1px solid ${
                  isPosted
                    ? "rgba(111, 207, 151, 0.25)"
                    : "rgba(217, 184, 108, 0.25)"
                }`,
              }}
            />

            {canPost && (
              <Button
                variant="contained"
                disabled={post.isPending || !isBalanced}
                onClick={() => post.mutate()}
                startIcon={<CheckCircleOutlineIcon />}
                sx={{
                  bgcolor: COLORS.accent,
                  color: "#081312",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: COLORS.accentHover,
                    boxShadow: "none",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(77, 182, 172, 0.25)",
                    color: COLORS.muted,
                  },
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
                color: COLORS.text,
                borderColor: COLORS.borderStrong,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 2,
                "&:hover": {
                  borderColor: COLORS.accent,
                  bgcolor: COLORS.accentSoft,
                },
              }}
            >
              Back
            </Button>
          </Stack>
        </Stack>

        {/* Post Error */}
        {post.isError && (
          <Alert
            severity="error"
            sx={{
              bgcolor: COLORS.dangerSoft,
              color: COLORS.danger,
              border: `1px solid rgba(233, 139, 139, 0.2)`,
              "& .MuiAlert-icon": {
                color: COLORS.danger,
              },
            }}
          >
            Could not post this entry. Check active accounts and balance.
          </Alert>
        )}

        {/* Entry Information */}
        <Box
          sx={{
            bgcolor: COLORS.cardHover,
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2.5,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <Stack spacing={1.5}>
            <Typography
              variant="body2"
              sx={{ color: COLORS.muted }}
            >
              <Box
                component="span"
                sx={{
                  color: COLORS.text,
                  fontWeight: 700,
                }}
              >
                Reference:
              </Box>{" "}
              {e.referenceType && e.referenceId
                ? `${e.referenceType} · ${e.referenceId}`
                : "Manual General Journal entry"}
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: COLORS.muted }}
            >
              <Box
                component="span"
                sx={{
                  color: COLORS.text,
                  fontWeight: 700,
                }}
              >
                Description:
              </Box>{" "}
              {e.description ?? "—"}
            </Typography>
          </Stack>
        </Box>

        {/* Journal Lines */}
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              color: COLORS.text,
              fontWeight: 700,
              mb: 1.5,
            }}
          >
            Journal Lines
          </Typography>

          <TableContainer
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${COLORS.border}`,
              bgcolor: COLORS.page,
              overflowX: "auto",
            }}
          >
            <Table sx={{ minWidth: 700 }}>
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
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 1.75,
                    }}
                  >
                    Account
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 1.75,
                    }}
                  >
                    Partner
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 1.75,
                    }}
                  >
                    Description
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 1.75,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Debit (₹)
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 1.75,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Credit (₹)
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {e.lines?.map((line) => (
                  <TableRow
                    key={line.id}
                    sx={{
                      "&:hover": {
                        bgcolor: COLORS.cardHover,
                      },
                      "& td": {
                        borderBottom: `1px solid ${COLORS.border}`,
                      },
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        fontWeight={600}
                        sx={{ color: COLORS.accent }}
                      >
                        {line.account.code} - {line.account.name}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.text,
                        fontWeight: 600,
                        py: 2,
                      }}
                    >
                      {line.partner?.name ?? "—"}
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        py: 2,
                      }}
                    >
                      {line.description ?? "—"}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.text,
                        fontWeight: 600,
                        py: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Number(line.debit) ? money(line.debit) : "—"}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.text,
                        fontWeight: 600,
                        py: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Number(line.credit) ? money(line.credit) : "—"}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Totals */}
                <TableRow
                  sx={{
                    bgcolor: COLORS.accentSoft,
                    "& td": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <TableCell colSpan={2} sx={{ py: 2 }}>
                    <Typography
                      fontWeight={800}
                      sx={{ color: COLORS.text }}
                    >
                      Totals
                    </Typography>
                  </TableCell>

                  <TableCell align="right" sx={{ py: 2 }}>
                    <Typography
                      fontWeight={800}
                      sx={{ color: COLORS.accent }}
                    >
                      {money(totalDebit)}
                    </Typography>
                  </TableCell>

                  <TableCell align="right" sx={{ py: 2 }}>
                    <Typography
                      fontWeight={800}
                      sx={{ color: COLORS.accent }}
                    >
                      {money(totalCredit)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Double Entry Validation */}
        <Alert
          severity={isBalanced ? "success" : "error"}
          sx={{
            bgcolor: isBalanced
              ? COLORS.successSoft
              : COLORS.dangerSoft,
            color: isBalanced ? COLORS.success : COLORS.danger,
            border: `1px solid ${
              isBalanced
                ? "rgba(111, 207, 151, 0.2)"
                : "rgba(233, 139, 139, 0.2)"
            }`,
            "& .MuiAlert-icon": {
              color: isBalanced ? COLORS.success : COLORS.danger,
            },
          }}
        >
          Double-entry validation: Total Debit (
          {money(totalDebit)}){" "}
          {isBalanced ? "EQUALS" : "DOES NOT EQUAL"} Total Credit (
          {money(totalCredit)}).
        </Alert>
      </Stack>
    </DarkContainer>
  );
};