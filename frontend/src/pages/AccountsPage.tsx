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
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as accountsApi from "../api/accounts.api";
import { EmptyState } from "../components/feedback/EmptyState";
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

const blank: accountsApi.AccountInput = {
  code: "",
  name: "",
  type: "ASSET",
  parentId: null,
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
      fontWeight: 600,
      px: 2,

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
  const canManage = isSystemAdministrator(user?.role);

  const [screen, setScreen] =
    useState<"list" | "form">("list");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] =
    useState<accountsApi.AccountInput>(blank);

  const [editing, setEditing] =
    useState<accountsApi.Account | null>(null);

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const params = useMemo(
    () => ({
      search: search || undefined,
      page,
      pageSize: 25,
    }),
    [search, page]
  );

  const accounts = useQuery({
    queryKey: ["accounts", params],
    queryFn: () => accountsApi.getAccounts(params),
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["accounts"],
    });

  const save = useMutation({
    mutationFn: (payload: accountsApi.AccountInput) =>
      editing
        ? accountsApi.updateAccount({
            id: editing.id,
            input: payload,
          })
        : accountsApi.createAccount(payload),

    onSuccess: () => {
      setScreen("list");
      setEditing(null);
      setForm(blank);
      refresh();
    },
  });

  const openCreate = () => {
    setEditing(null);

    setForm({
      ...blank,
      code: `ACC-${Math.floor(
        1000 + Math.random() * 9000
      )}`,
    });

    setValidationError(null);
    setScreen("form");
  };

  const openRecord = (acc: accountsApi.Account) => {
    setEditing(acc);

    setForm({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      parentId: acc.parentId,
    });

    setValidationError(null);
    setScreen("form");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!form.name || form.name.trim().length < 2) {
      setValidationError(
        "Account Name must be at least 2 characters long."
      );
      return;
    }

    setValidationError(null);
    save.mutate(form);
  };

  if (screen === "form") {
    return (
      <DarkContainer title="Chart of Accounts">
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
              disabled={save.isPending || !canManage}
            >
              {save.isPending ? "..." : "Confirm"}
            </CustomButton>

            <CustomButton
              type="button"
              onClick={() => {
                setScreen("list");
                setEditing(null);
              }}
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

          {/* Form Fields */}
          <Stack
            spacing={4}
            maxWidth={650}
          >
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
                minWidth={140}
                sx={{
                  color: COLORS.text,
                  fontWeight: 500,
                }}
              >
                Account Name
              </Typography>

              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. Bank A/c, Debtors A/c"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
                sx={darkTextFieldSx}
              />
            </Stack>

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
                minWidth={140}
                sx={{
                  color: COLORS.text,
                  fontWeight: 500,
                }}
              >
                Type
              </Typography>

              <TextField
                select
                SelectProps={darkSelectProps}
                variant="standard"
                fullWidth
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type:
                      e.target.value as accountsApi.AccountType,
                  })
                }
                sx={darkTextFieldSx}
              >
                <MenuItem value="ASSET">
                  Asset
                </MenuItem>

                <MenuItem value="LIABILITY">
                  Liability
                </MenuItem>

                <MenuItem value="REVENUE">
                  Income
                </MenuItem>

                <MenuItem value="EXPENSE">
                  Expenses
                </MenuItem>

                <MenuItem value="EQUITY">
                  Capital
                </MenuItem>
              </TextField>
            </Stack>

            <Box
              sx={{
                mt: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: COLORS.infoSoft,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: COLORS.muted,
                  lineHeight: 1.7,
                }}
              >
                Each account is assigned an Account
                Type, which is used for financial
                reporting (Balance Sheet and Profit &
                Loss).
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedAccounts =
    accounts.data?.data ?? [];

  return (
    <DarkContainer title="Chart of Accounts">
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
            disabled={!canManage}
          >
            New
          </CustomButton>

          <TextField
            variant="outlined"
            size="small"
            placeholder="Search account..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            sx={{
              width: {
                xs: "100%",
                sm: 300,
              },

              "& .MuiOutlinedInput-root": {
                color: COLORS.text,
                bgcolor: COLORS.page,
                borderRadius: 2,

                "& fieldset": {
                  borderColor: COLORS.border,
                },

                "&:hover fieldset": {
                  borderColor: COLORS.borderStrong,
                },

                "&.Mui-focused fieldset": {
                  borderColor: COLORS.accent,
                },
              },

              "& .MuiInputBase-input::placeholder": {
                color: COLORS.muted,
                opacity: 1,
              },
            }}
          />

          <CustomButton
            onClick={() => window.history.back()}
          >
            Back
          </CustomButton>
        </Stack>

        {/* Table */}
        {accounts.isLoading ? (
          <LoadingState
            label="Loading chart of accounts..."
          />
        ) : accounts.isError ? (
          <ErrorState
            message={apiError(accounts.error)}
            onRetry={() =>
              void accounts.refetch()
            }
          />
        ) : renderedAccounts.length === 0 ? (
          <EmptyState message="No accounts found." />
        ) : (
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
                    Account Name
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 2,
                    }}
                  >
                    Code
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 2,
                    }}
                  >
                    Type
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {renderedAccounts.map((acc) => (
                  <TableRow
                    key={acc.id}
                    hover
                    onClick={() =>
                      canManage && openRecord(acc)
                    }
                    sx={{
                      cursor: canManage
                        ? "pointer"
                        : "default",

                      "& td": {
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 2,
                      },

                      "&:hover": {
                        bgcolor: canManage
                          ? COLORS.cardHover
                          : "transparent",
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
                      {acc.name}
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                      }}
                    >
                      {acc.code}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={displayType(acc.type)}
                        sx={{
                          bgcolor:
                            COLORS.accentSoft,
                          color: COLORS.accent,
                          border: `1px solid ${COLORS.border}`,
                          fontWeight: 600,
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 3,
            pt: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: COLORS.muted,
            }}
          >
            {accounts.data?.meta.total ?? 0} accounts
          </Typography>

          <Pagination
            page={page}
            count={Math.max(
              1,
              accounts.data?.meta.totalPages ?? 1
            )}
            onChange={(_, value) =>
              setPage(value)
            }
            sx={{
              "& .MuiPaginationItem-root": {
                color: COLORS.muted,
                borderColor: COLORS.border,
              },

              "& .MuiPaginationItem-root:hover": {
                bgcolor: COLORS.accentSoft,
                color: COLORS.accent,
              },

              "& .Mui-selected": {
                bgcolor: `${COLORS.accentSoft} !important`,
                color: `${COLORS.accent} !important`,
                border: `1px solid ${COLORS.borderStrong}`,
              },
            }}
          />
        </Box>
      </Stack>
    </DarkContainer>
  );
};