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
  Typography,
} from "@mui/material";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as api from "../api/budgets.api";
import { getAnalytics } from "../api/analyticals.api";
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
      maxWidth: 1000,
      mx: "auto",
      pt: 5,
      pb: 7,
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
          mb: 4,
          display: "inline-block",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: COLORS.accent,
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>
      </Box>
    )}

    <Box
      sx={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        p: 4,
        bgcolor: COLORS.card,
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
    borderBottomColor: COLORS.muted,
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

  "& input::placeholder": {
    color: COLORS.muted,
    opacity: 0.8,
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

        "& .MuiMenuItem-root:hover": {
          bgcolor: COLORS.cardHover,
        },

        "& .Mui-selected": {
          bgcolor: `${COLORS.accentSoft} !important`,
          color: COLORS.accent,
        },
      },
    },
  },
};

const CustomButton = ({
  children,
  active,
  ...props
}: any) => (
  <Button
    variant="outlined"
    sx={{
      color: active ? "#071313" : COLORS.text,
      bgcolor: active ? COLORS.accent : "transparent",
      borderColor: active
        ? COLORS.accent
        : COLORS.borderStrong,
      borderRadius: 2,
      textTransform: "none",
      minWidth: 80,
      px: 2,
      fontWeight: 600,

      "&:hover": {
        bgcolor: active
          ? COLORS.accentHover
          : COLORS.accentSoft,
        borderColor: active
          ? COLORS.accentHover
          : COLORS.accent,
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

export const BudgetsPage = () => {
  const queryClient = useQueryClient();

  const [screen, setScreen] =
    useState<"list" | "form">("list");

  const [view, setView] =
    useState<"list" | "kanban">("list");

  const [name, setName] = useState("");
  const [period, setPeriod] =
    useState("2026-Q1");

  const [plannedAmount, setPlannedAmount] =
    useState<number>(50000);

  const [responsiblePerson, setResponsiblePerson] =
    useState("");

  const [analyticAccountId, setAnalyticAccountId] =
    useState<number | "">("");

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const budgets = useQuery({
    queryKey: ["budgets"],
    queryFn: () => api.getBudgets(),
  });

  const analytics = useQuery({
    queryKey: ["analyticals-for-budget"],
    queryFn: () => getAnalytics(),
  });

  const save = useMutation({
    mutationFn: () =>
      api.createBudget({
        name,
        period,
        plannedAmount: Number(plannedAmount),
        responsiblePerson,
        analyticAccountId: Number(
          analyticAccountId
        ),
      }),

    onSuccess: () => {
      setScreen("list");
      setName("");
      setResponsiblePerson("");

      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
    },
  });

  const openCreate = () => {
    setName("");
    setPeriod("2026-Q1");
    setPlannedAmount(50000);
    setResponsiblePerson("");

    setAnalyticAccountId(
      analytics.data?.data[0]?.id || ""
    );

    setValidationError(null);
    setScreen("form");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();

    if (!name || name.trim().length < 2) {
      setValidationError(
        "Budget Name is required."
      );
      return;
    }

    if (
      !responsiblePerson ||
      responsiblePerson.trim().length < 2
    ) {
      setValidationError(
        "Responsible Person is required."
      );
      return;
    }

    if (!analyticAccountId) {
      setValidationError(
        "Please select an Analytic Account."
      );
      return;
    }

    if (plannedAmount <= 0) {
      setValidationError(
        "Planned amount must be greater than zero."
      );
      return;
    }

    setValidationError(null);
    save.mutate();
  };

  if (screen === "form") {
    return (
      <DarkContainer title="Budgets">
        <Stack
          component="form"
          onSubmit={submit}
          spacing={5}
        >
          {/* Form Actions */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              pb: 1,
            }}
          >
            <CustomButton
              type="submit"
              active
              disabled={save.isPending}
            >
              {save.isPending
                ? "..."
                : "Confirm"}
            </CustomButton>

            <CustomButton
              type="button"
              onClick={() => setScreen("list")}
            >
              Back
            </CustomButton>
          </Stack>

          {/* Alerts */}
          <Stack spacing={2}>
            {validationError && (
              <Alert
                severity="warning"
                sx={{
                  bgcolor: COLORS.warningSoft,
                  color: COLORS.warning,
                  border: `1px solid ${COLORS.border}`,
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
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                {apiError(save.error)}
              </Alert>
            )}
          </Stack>

          {/* Form */}
          <Stack
            spacing={4}
            maxWidth={700}
          >
            {/* Budget Name */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              spacing={2.5}
            >
              <Typography
                minWidth={160}
                sx={{
                  color: COLORS.text,
                  fontWeight: 500,
                }}
              >
                Budget Name
              </Typography>

              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. Q1 Marketing & Office Operations"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
                sx={darkTextFieldSx}
              />
            </Stack>

            {/* Period */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              spacing={2.5}
            >
              <Typography
                minWidth={160}
                sx={{
                  color: COLORS.text,
                  fontWeight: 500,
                }}
              >
                Period
              </Typography>

              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. 2026-Q1, 2026-Annual"
                value={period}
                onChange={(e) =>
                  setPeriod(e.target.value)
                }
                required
                sx={darkTextFieldSx}
              />
            </Stack>

            {/* Responsible Person */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              spacing={2.5}
            >
              <Typography
                minWidth={160}
                sx={{
                  color: COLORS.text,
                  fontWeight: 500,
                }}
              >
                Responsible Person
              </Typography>

              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. Rahul Sharma"
                value={responsiblePerson}
                onChange={(e) =>
                  setResponsiblePerson(
                    e.target.value
                  )
                }
                required
                sx={darkTextFieldSx}
              />
            </Stack>

            {/* Analytic Account */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              spacing={2.5}
            >
              <Typography
                minWidth={160}
                sx={{
                  color: COLORS.text,
                  fontWeight: 500,
                }}
              >
                Analytic Account
              </Typography>

              <TextField
                select
                SelectProps={darkSelectProps}
                variant="standard"
                fullWidth
                value={analyticAccountId}
                onChange={(e) =>
                  setAnalyticAccountId(
                    e.target.value
                      ? Number(e.target.value)
                      : ""
                  )
                }
                required
                sx={darkTextFieldSx}
              >
                <MenuItem
                  value=""
                  disabled
                >
                  Select Analytic Account
                </MenuItem>

                {analytics.data?.data.map(
                  (a) => (
                    <MenuItem
                      key={a.id}
                      value={a.id}
                    >
                      {a.name} ({a.type})
                    </MenuItem>
                  )
                )}
              </TextField>
            </Stack>

            {/* Planned Amount */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              spacing={2.5}
            >
              <Typography
                minWidth={160}
                sx={{
                  color: COLORS.text,
                  fontWeight: 500,
                }}
              >
                Planned Amount (Rs.)
              </Typography>

              <TextField
                type="number"
                variant="standard"
                fullWidth
                value={plannedAmount}
                onChange={(e) =>
                  setPlannedAmount(
                    Number(e.target.value)
                  )
                }
                required
                sx={darkTextFieldSx}
              />
            </Stack>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedBudgets =
    budgets.data?.data ?? [];

  return (
    <DarkContainer title="Budgets">
      <Stack spacing={4}>
        {/* Header */}
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            sm: "center",
          }}
          spacing={3}
          sx={{
            pb: 1,
          }}
        >
          <CustomButton
            onClick={openCreate}
            active
          >
            New
          </CustomButton>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <CustomButton
              onClick={() =>
                window.history.back()
              }
            >
              Back
            </CustomButton>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, next) =>
                next && setView(next)
              }
              sx={{
                bgcolor: COLORS.card,
                border: `1px solid ${COLORS.borderStrong}`,
                borderRadius: 2,
                overflow: "hidden",

                "& .MuiToggleButton-root": {
                  color: COLORS.muted,
                  borderColor: COLORS.border,

                  "&:hover": {
                    bgcolor: COLORS.cardHover,
                    color: COLORS.text,
                  },

                  "&.Mui-selected": {
                    bgcolor: COLORS.accentSoft,
                    color: COLORS.accent,

                    "&:hover": {
                      bgcolor:
                        COLORS.accentSoft,
                    },
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
        {budgets.isLoading ? (
          <LoadingState
            label="Loading budgets..."
          />
        ) : budgets.isError ? (
          <ErrorState
            message={apiError(
              budgets.error
            )}
            onRetry={() =>
              void budgets.refetch()
            }
          />
        ) : renderedBudgets.length === 0 ? (
          <EmptyState
            message="No budgets created yet. Click 'New' to define a budget."
          />
        ) : view === "list" ? (
          /* List View */
          <TableContainer
            sx={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              bgcolor: COLORS.card,
              overflow: "hidden",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: COLORS.page,
                  }}
                >
                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 2,
                    }}
                  >
                    Budget Name
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 2,
                    }}
                  >
                    Period
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 2,
                    }}
                  >
                    Responsible
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 2,
                    }}
                  >
                    Analytic Account
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 2,
                    }}
                  >
                    Planned Amount
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {renderedBudgets.map(
                  (b) => (
                    <TableRow
                      key={b.id}
                      hover
                      sx={{
                        "& td": {
                          borderBottom: `1px solid ${COLORS.border}`,
                          py: 2,
                        },

                        "&:hover": {
                          bgcolor:
                            COLORS.cardHover,
                        },

                        "&:last-child td": {
                          borderBottom: "none",
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          color: COLORS.text,
                          fontWeight: 600,
                        }}
                      >
                        {b.name}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.muted,
                        }}
                      >
                        {b.period}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {b.responsiblePerson}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {b.analyticAccount?.name ||
                          "—"}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.accent,
                          fontWeight: 700,
                        }}
                      >
                        {formatMoney(
                          b.plannedAmount
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* Kanban View */
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 3,
              pt: 1,
            }}
          >
            {renderedBudgets.map(
              (b) => (
                <Paper
                  key={b.id}
                  variant="outlined"
                  sx={{
                    p: 3,
                    bgcolor: COLORS.card,
                    borderColor: COLORS.border,
                    borderRadius: 3,
                    transition:
                      "all 0.2s ease",

                    "&:hover": {
                      bgcolor:
                        COLORS.cardHover,
                      borderColor:
                        COLORS.borderStrong,
                      transform:
                        "translateY(-2px)",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor:
                          COLORS.accentSoft,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "center",
                        flexShrink: 0,
                      }}
                    >
                      <AccountBalanceWalletOutlinedIcon
                        sx={{
                          color:
                            COLORS.accent,
                        }}
                      />
                    </Box>

                    <Stack spacing={0.5}>
                      <Typography
                        sx={{
                          color:
                            COLORS.text,
                          fontWeight: 700,
                        }}
                      >
                        {b.name}
                      </Typography>

                      <Typography
                        sx={{
                          color:
                            COLORS.muted,
                          fontSize:
                            "0.82rem",
                        }}
                      >
                        {b.period} ·{" "}
                        {
                          b.responsiblePerson
                        }
                      </Typography>

                      <Typography
                        sx={{
                          color:
                            COLORS.accent,
                          fontWeight: 600,
                          fontSize:
                            "0.9rem",
                        }}
                      >
                        {formatMoney(
                          b.plannedAmount
                        )}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              )
            )}
          </Box>
        )}
      </Stack>
    </DarkContainer>
  );
};