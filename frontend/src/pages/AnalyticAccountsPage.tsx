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
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/analyticals.api";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";

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

const apiError = (error: unknown) =>
  axios.isAxiosError<{ error?: string }>(error)
    ? error.response?.data?.error ?? "Request failed."
    : "Request failed.";

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
      px: { xs: 2, sm: 3 },
      pb: 5,
    }}
  >
    {title && (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 2.5,
          py: 1,
          mb: 3,
          borderRadius: 2,
          bgcolor: COLORS.accentSoft,
          border: `1px solid ${COLORS.accent}`,
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
        p: { xs: 2, sm: 3.5 },
        bgcolor: COLORS.card,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
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
        maxHeight: 300,
        border: `1px solid ${COLORS.border}`,
        "& .MuiMenuItem-root": {
          "&:hover": {
            bgcolor: COLORS.cardHover,
          },
        },
        "& .Mui-selected": {
          bgcolor: `${COLORS.accentSoft} !important`,
          color: COLORS.accent,
        },
      },
    },
  },
};

const CustomButton = ({ children, active, ...props }: any) => (
  <Button
    variant="outlined"
    sx={{
      color: active ? COLORS.page : COLORS.text,
      bgcolor: active ? COLORS.accent : "transparent",
      borderColor: active ? COLORS.accent : COLORS.borderStrong,
      borderRadius: 2,
      textTransform: "none",
      minWidth: 82,
      px: 2,
      py: 0.8,
      fontWeight: 600,
      transition: "all 0.2s ease",
      "&:hover": {
        bgcolor: active ? COLORS.accentHover : COLORS.accentSoft,
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
    queryFn: () => api.getAnalytics({ search: search || undefined }),
  });

  const save = useMutation({
    mutationFn: () => api.createAnalytic({ name, type }),
    onSuccess: () => {
      setScreen("list");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["analyticals"] });
    },
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
      setValidationError(
        "Analytic Account name must be at least 2 characters."
      );
      return;
    }

    setValidationError(null);
    save.mutate();
  };

  if (screen === "form") {
    return (
      <DarkContainer title="Analytic Accounts">
        <Stack component="form" onSubmit={submit} spacing={4}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            gap={2}
          >
            <CustomButton type="submit" active disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Confirm"}
            </CustomButton>

            <CustomButton onClick={() => setScreen("list")}>
              Back
            </CustomButton>
          </Stack>

          {validationError && (
            <Alert
              severity="warning"
              sx={{
                bgcolor: COLORS.warningSoft,
                color: COLORS.warning,
                border: `1px solid ${COLORS.warning}`,
                "& .MuiAlert-icon": {
                  color: COLORS.warning,
                },
              }}
            >
              {validationError}
            </Alert>
          )}

          {save.isError && (
            <Alert
              severity="error"
              sx={{
                bgcolor: COLORS.dangerSoft,
                color: COLORS.danger,
                border: `1px solid ${COLORS.danger}`,
                "& .MuiAlert-icon": {
                  color: COLORS.danger,
                },
              }}
            >
              {apiError(save.error)}
            </Alert>
          )}

          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2.5,
              border: `1px solid ${COLORS.border}`,
              bgcolor: COLORS.page,
              maxWidth: 720,
            }}
          >
            <Stack spacing={3.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={{ xs: 1, sm: 2 }}
              >
                <Typography
                  sx={{
                    color: COLORS.text,
                    minWidth: { sm: 180 },
                    fontWeight: 600,
                  }}
                >
                  Analytic Account Name
                </Typography>

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

              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={{ xs: 1, sm: 2 }}
              >
                <Typography
                  sx={{
                    color: COLORS.text,
                    minWidth: { sm: 180 },
                    fontWeight: 600,
                  }}
                >
                  Type
                </Typography>

                <TextField
                  select
                  SelectProps={darkSelectProps}
                  variant="standard"
                  fullWidth
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as api.AnalyticType)
                  }
                  sx={darkTextFieldSx}
                >
                  <MenuItem value="INCOME">Income</MenuItem>
                  <MenuItem value="EXPENSE">Expense</MenuItem>
                </TextField>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedData = analytics.data?.data ?? [];

  return (
    <DarkContainer title="Analytic Accounts">
      <Stack spacing={4}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          gap={2}
        >
          <CustomButton onClick={openCreate} active>
            New
          </CustomButton>

          <TextField
            variant="outlined"
            size="small"
            placeholder="Search analytic account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: "100%", md: 320 },
              "& .MuiInputBase-root": {
                color: COLORS.text,
                bgcolor: COLORS.page,
                borderRadius: 2,
              },
              "& input::placeholder": {
                color: COLORS.muted,
                opacity: 1,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: COLORS.borderStrong,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: COLORS.accent,
              },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: COLORS.accent,
                },
            }}
          />

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent={{ xs: "space-between", md: "flex-end" }}
          >
            <CustomButton onClick={() => window.history.back()}>
              Back
            </CustomButton>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, next) => next && setView(next)}
              sx={{
                bgcolor: COLORS.page,
                border: `1px solid ${COLORS.borderStrong}`,
                borderRadius: 2,
                p: 0.25,
                "& .MuiToggleButton-root": {
                  border: "none",
                  borderRadius: 1.5,
                  color: COLORS.muted,
                  px: 1.2,
                  "&:hover": {
                    bgcolor: COLORS.cardHover,
                  },
                  "&.Mui-selected": {
                    bgcolor: COLORS.accentSoft,
                    color: COLORS.accent,
                  },
                },
              }}
            >
              <ToggleButton value="list">
                <ViewListIcon />
              </ToggleButton>

              <ToggleButton value="kanban">
                <ViewModuleIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {/* Content */}
        {analytics.isLoading ? (
          <LoadingState label="Loading analytic accounts..." />
        ) : analytics.isError ? (
          <ErrorState
            message={apiError(analytics.error)}
            onRetry={() => void analytics.refetch()}
          />
        ) : renderedData.length === 0 ? (
          <EmptyState message="No analytic accounts found. Click 'New' to create one." />
        ) : view === "list" ? (
          <TableContainer
            sx={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2.5,
              bgcolor: COLORS.page,
              overflowX: "auto",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: COLORS.cardHover,
                    "& th": {
                      borderBottom: `1px solid ${COLORS.border}`,
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      py: 1.8,
                    }}
                  >
                    Name
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      py: 1.8,
                    }}
                  >
                    Type
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 700,
                      py: 1.8,
                    }}
                  >
                    Linked Budgets
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {renderedData.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      transition: "background-color 0.2s ease",
                      "&:hover": {
                        bgcolor: COLORS.cardHover,
                      },
                      "& td": {
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 1.8,
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        color: COLORS.text,
                        fontWeight: 600,
                      }}
                    >
                      {item.name}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          item.type === "INCOME" ? "Income" : "Expense"
                        }
                        sx={{
                          bgcolor:
                            item.type === "INCOME"
                              ? COLORS.successSoft
                              : COLORS.dangerSoft,
                          color:
                            item.type === "INCOME"
                              ? COLORS.success
                              : COLORS.danger,
                          border: `1px solid ${
                            item.type === "INCOME"
                              ? "rgba(111, 207, 151, 0.25)"
                              : "rgba(233, 139, 139, 0.25)"
                          }`,
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                      }}
                    >
                      {item._count?.budgets ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 3,
            }}
          >
            {renderedData.map((item) => (
              <Paper
                key={item.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  bgcolor: COLORS.page,
                  borderColor: COLORS.border,
                  borderRadius: 2.5,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: COLORS.cardHover,
                    borderColor: COLORS.borderStrong,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      flexShrink: 0,
                      bgcolor: COLORS.accentSoft,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AccountTreeOutlinedIcon
                      sx={{
                        color: COLORS.accent,
                        fontSize: 26,
                      }}
                    />
                  </Box>

                  <Stack spacing={0.5} minWidth={0}>
                    <Typography
                      sx={{
                        color: COLORS.text,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Chip
                      size="small"
                      label={item.type === "INCOME" ? "Income" : "Expense"}
                      sx={{
                        width: "fit-content",
                        height: 24,
                        bgcolor:
                          item.type === "INCOME"
                            ? COLORS.successSoft
                            : COLORS.dangerSoft,
                        color:
                          item.type === "INCOME"
                            ? COLORS.success
                            : COLORS.danger,
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Stack>

                <Box
                  sx={{
                    mt: 2.5,
                    pt: 2,
                    borderTop: `1px solid ${COLORS.border}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: COLORS.muted,
                    }}
                  >
                    Linked Budgets
                  </Typography>

                  <Typography
                    sx={{
                      color: COLORS.text,
                      fontWeight: 700,
                      mt: 0.5,
                    }}
                  >
                    {item._count?.budgets ?? 0}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Stack>
    </DarkContainer>
  );
};