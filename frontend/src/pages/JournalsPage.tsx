import { useState, type FormEvent } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
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
import * as journalsApi from "../api/journals.api";
import { getAccounts } from "../api/accounts.api";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";

const COLORS = {
  page: "#0B1220",
  card: "#111B2E",
  cardHover: "#16233A",
  border: "rgba(148, 163, 184, 0.16)",
  borderStrong: "rgba(148, 163, 184, 0.28)",

  text: "#F1F5F9",
  muted: "#94A3B8",

  accent: "#4DB6AC",
  accentHover: "#3F9E96",
  accentSoft: "rgba(77, 182, 172, 0.12)",

  success: "#6FCF97",
  successSoft: "rgba(111, 207, 151, 0.12)",

  danger: "#E98B8B",
  dangerSoft: "rgba(233, 139, 139, 0.10)",

  warning: "#D9B86C",
  warningSoft: "rgba(217, 184, 108, 0.10)",

  info: "#7FA9C9",
  infoSoft: "rgba(127, 169, 201, 0.10)",
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

export const JournalsPage = () => {
  const queryClient = useQueryClient();

  const [screen, setScreen] =
    useState<"list" | "form">("list");

  const [name, setName] = useState("");
  const [type, setType] =
    useState<journalsApi.Journal["type"]>("SALES");

  const [defaultAccountId, setDefaultAccountId] =
    useState<number | "">("");

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const journals = useQuery({
    queryKey: ["journals"],
    queryFn: journalsApi.getJournals,
  });

  const accounts = useQuery({
    queryKey: ["accounts-for-journals"],
    queryFn: () =>
      getAccounts({
        page: 1,
        pageSize: 100,
      }),
  });

  const save = useMutation({
    mutationFn: () =>
      journalsApi.createJournal({
        name,
        type,
        defaultAccountId: defaultAccountId
          ? Number(defaultAccountId)
          : null,
      }),

    onSuccess: () => {
      setScreen("list");
      setName("");
      setDefaultAccountId("");

      queryClient.invalidateQueries({
        queryKey: ["journals"],
      });
    },
  });

  const openCreate = () => {
    setName("");
    setType("SALES");
    setDefaultAccountId("");
    setValidationError(null);
    setScreen("form");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();

    if (!name || name.trim().length < 2) {
      setValidationError(
        "Journal Name must be at least 2 characters long."
      );
      return;
    }

    setValidationError(null);
    save.mutate();
  };

  if (screen === "form") {
    return (
      <DarkContainer title="Journals">
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
              {save.isPending ? "..." : "Confirm"}
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
            maxWidth={650}
          >
            {/* Journal Name */}
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
                Journal Name
              </Typography>

              <TextField
                variant="standard"
                fullWidth
                placeholder="e.g. Sales, Purchase, Bank"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
                sx={darkTextFieldSx}
              />
            </Stack>

            {/* Journal Type */}
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
                Journal Type
              </Typography>

              <TextField
                select
                SelectProps={darkSelectProps}
                variant="standard"
                fullWidth
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value as journalsApi.Journal["type"]
                  )
                }
                sx={darkTextFieldSx}
              >
                <MenuItem value="SALES">
                  Sales
                </MenuItem>

                <MenuItem value="PURCHASE">
                  Purchase
                </MenuItem>

                <MenuItem value="BANK">
                  Bank
                </MenuItem>

                <MenuItem value="CASH">
                  Cash
                </MenuItem>

                <MenuItem value="GENERAL">
                  General
                </MenuItem>
              </TextField>
            </Stack>

            {/* Default Account */}
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
                Default Account
              </Typography>

              <TextField
                select
                SelectProps={darkSelectProps}
                variant="standard"
                fullWidth
                value={defaultAccountId}
                onChange={(e) =>
                  setDefaultAccountId(
                    e.target.value
                      ? Number(e.target.value)
                      : ""
                  )
                }
                sx={darkTextFieldSx}
              >
                <MenuItem value="">
                  None
                </MenuItem>

                {accounts.data?.data.map((acc) => (
                  <MenuItem
                    key={acc.id}
                    value={acc.id}
                  >
                    {acc.name} ({acc.code})
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedJournals = journals.data ?? [];

  return (
    <DarkContainer title="Journals">
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

          <CustomButton
            onClick={() => window.history.back()}
          >
            Back
          </CustomButton>
        </Stack>

        {/* Content */}
        {journals.isLoading ? (
          <LoadingState label="Loading journals..." />
        ) : journals.isError ? (
          <ErrorState
            message={apiError(journals.error)}
            onRetry={() =>
              void journals.refetch()
            }
          />
        ) : renderedJournals.length === 0 ? (
          <EmptyState message="No journals found." />
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
                    Journal Name
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

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${COLORS.border}`,
                      py: 2,
                    }}
                  >
                    Default Account
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {renderedJournals.map((j) => (
                  <TableRow
                    key={j.id}
                    hover
                    sx={{
                      "& td": {
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 2,
                      },

                      "&:hover": {
                        bgcolor: COLORS.cardHover,
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
                      {j.name}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={j.type}
                        sx={{
                          bgcolor: COLORS.accentSoft,
                          color: COLORS.accent,
                          border: `1px solid ${COLORS.border}`,
                          fontWeight: 600,
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                      }}
                    >
                      {j.defaultAccount
                        ? `${j.defaultAccount.name} (${j.defaultAccount.code})`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </DarkContainer>
  );
};