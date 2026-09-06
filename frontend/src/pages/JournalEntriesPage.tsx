import { useState } from "react";
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
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as journalsApi from "../api/journals.api";
import { getAccounts } from "../api/accounts.api";
import { getContacts } from "../api/contacts.api";
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
      maxWidth: 1100,
      mx: "auto",
      pt: 4,
      pb: 5,
    }}
  >
    {title && (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 2.5,
          py: 1.25,
          mb: 3,
          bgcolor: COLORS.card,
          border: `1px solid ${COLORS.borderStrong}`,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: COLORS.text,
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
        borderRadius: 4,
        p: { xs: 2, sm: 3.5 },
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
        maxHeight: 320,
        border: `1px solid ${COLORS.border}`,

        "& .MuiMenuItem-root": {
          py: 1.2,
        },

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
      color: active ? COLORS.page : COLORS.text,
      bgcolor: active ? COLORS.accent : "transparent",
      borderColor: active
        ? COLORS.accent
        : COLORS.borderStrong,
      borderRadius: 2,
      textTransform: "none",
      minWidth: 90,
      px: 2,
      py: 0.9,
      fontWeight: 600,

      "&:hover": {
        bgcolor: active
          ? COLORS.accentHover
          : COLORS.accentSoft,
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

  const [journalId, setJournalId] = useState<number | "">("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState("");

  const [lines, setLines] = useState<FormLine[]>([
    {
      accountId: "",
      partnerId: "",
      debit: 0,
      credit: 0,
    },
    {
      accountId: "",
      partnerId: "",
      debit: 0,
      credit: 0,
    },
  ]);

  const journals = useQuery({
    queryKey: ["journals"],
    queryFn: journalsApi.getJournals,
  });

  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: () =>
      getAccounts({
        page: 1,
        pageSize: 100,
      }),
  });

  const contacts = useQuery({
    queryKey: ["contacts-simple"],
    queryFn: () =>
      getContacts({
        page: 1,
        pageSize: 100,
      }),
  });

  const entries = useQuery({
    queryKey: ["journal-entries", search, page],
    queryFn: () =>
      journalsApi.getEntries({
        search: search || undefined,
        page,
        pageSize: 15,
      }),
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
          partnerId: l.partnerId
            ? Number(l.partnerId)
            : null,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
      }),

    onSuccess: () => {
      setScreen("list");

      queryClient.invalidateQueries({
        queryKey: ["journal-entries"],
      });
    },
  });

  const totalDebit = lines.reduce(
    (sum, line) => sum + (Number(line.debit) || 0),
    0
  );

  const totalCredit = lines.reduce(
    (sum, line) => sum + (Number(line.credit) || 0),
    0
  );

  const isBalanced =
    totalDebit > 0 &&
    totalCredit > 0 &&
    Math.abs(totalDebit - totalCredit) < 0.01;

  const hasInvalidLines = lines.some(
    (line) =>
      !line.accountId ||
      (line.debit === 0 && line.credit === 0)
  );

  const updateLine = (
    idx: number,
    patch: Partial<FormLine>
  ) => {
    setLines(
      lines.map((line, i) =>
        i === idx
          ? {
              ...line,
              ...patch,
            }
          : line
      )
    );
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        accountId: "",
        partnerId: "",
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length > 2) {
      setLines(
        lines.filter((_, i) => i !== idx)
      );
    }
  };

  const openCreate = () => {
    setJournalId(
      journals.data?.[0]?.id || ""
    );

    setEntryDate(
      new Date().toISOString().slice(0, 10)
    );

    setDescription("");

    setLines([
      {
        accountId: "",
        partnerId: "",
        debit: 0,
        credit: 0,
      },
      {
        accountId: "",
        partnerId: "",
        debit: 0,
        credit: 0,
      },
    ]);

    setScreen("form");
  };

  if (screen === "form") {
    return (
      <DarkContainer title="Journal Entries">
        <Stack spacing={4}>

          {/* Actions */}
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
            gap={2}
          >
            <Stack
              direction="row"
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
            >
              <CustomButton
                active
                disabled={
                  !isBalanced ||
                  !journalId ||
                  hasInvalidLines ||
                  save.isPending
                }
                onClick={() =>
                  save.mutate(true)
                }
              >
                {save.isPending
                  ? "Posting..."
                  : "Post"}
              </CustomButton>

              <CustomButton
                onClick={() =>
                  setScreen("list")
                }
              >
                Cancel
              </CustomButton>
            </Stack>

            <CustomButton
              onClick={() =>
                setScreen("list")
              }
            >
              Back
            </CustomButton>
          </Stack>

          {/* Errors */}
          {save.isError && (
            <Alert
              severity="error"
              sx={{
                borderRadius: 2,
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

          {!isBalanced &&
            (totalDebit > 0 ||
              totalCredit > 0) && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2,
                  bgcolor: COLORS.dangerSoft,
                  color: COLORS.danger,
                  border: `1px solid ${COLORS.danger}`,

                  "& .MuiAlert-icon": {
                    color: COLORS.danger,
                  },
                }}
              >
                <b>Blocking warning:</b>{" "}
                Total Debit (
                {formatMoney(totalDebit)})
                {" "}and Total Credit (
                {formatMoney(totalCredit)})
                {" "}do not match.
              </Alert>
            )}

          {/* Entry Information */}
          <Box
            sx={{
              bgcolor: COLORS.page,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: { xs: 2, md: 3 },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: COLORS.text,
                fontWeight: 700,
                mb: 2.5,
              }}
            >
              Entry Information
            </Typography>

            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={4}
            >
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                alignItems={{
                  xs: "flex-start",
                  sm: "center",
                }}
                spacing={2}
                flex={1}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 130,
                    fontSize: 14,
                  }}
                >
                  Accounting Date
                </Typography>

                <TextField
                  type="date"
                  variant="standard"
                  fullWidth
                  value={entryDate}
                  onChange={(e) =>
                    setEntryDate(e.target.value)
                  }
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                alignItems={{
                  xs: "flex-start",
                  sm: "center",
                }}
                spacing={2}
                flex={1}
              >
                <Typography
                  sx={{
                    color: COLORS.muted,
                    minWidth: 70,
                    fontSize: 14,
                  }}
                >
                  Journal
                </Typography>

                <TextField
                  select
                  SelectProps={darkSelectProps}
                  variant="standard"
                  fullWidth
                  value={journalId}
                  onChange={(e) =>
                    setJournalId(
                      Number(e.target.value)
                    )
                  }
                  sx={darkTextFieldSx}
                >
                  {journals.data?.map((j) => (
                    <MenuItem
                      key={j.id}
                      value={j.id}
                    >
                      {j.name} ({j.type})
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>
          </Box>

          {/* Description */}
          <TextField
            variant="outlined"
            label="Reference / Description"
            placeholder="e.g. Office supplies purchase"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            sx={{
              "& .MuiInputBase-root": {
                color: COLORS.text,
              },

              "& .MuiInputLabel-root": {
                color: COLORS.muted,
              },

              "& .MuiInputLabel-root.Mui-focused": {
                color: COLORS.accent,
              },

              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: COLORS.borderStrong,
              },

              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: COLORS.accent,
              },

              "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: COLORS.accent,
              },
            }}
            fullWidth
          />

          {/* Journal Lines */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: COLORS.text,
                  fontWeight: 700,
                }}
              >
                Journal Lines
              </Typography>

              <Chip
                size="small"
                label={`${lines.length} Lines`}
                sx={{
                  bgcolor: COLORS.accentSoft,
                  color: COLORS.accent,
                  border: `1px solid ${COLORS.accent}`,
                }}
              />
            </Stack>

            <TableContainer
              sx={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 3,
                overflowX: "auto",
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 850,

                  "& .MuiTableCell-root": {
                    px: 2,
                    py: 1.8,
                  },
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: COLORS.page,

                      "& th": {
                        borderBottom: `1px solid ${COLORS.borderStrong}`,
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                      }}
                    >
                      Account
                    </TableCell>

                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontWeight: 600,
                      }}
                    >
                      Partner
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.muted,
                        width: 150,
                        fontWeight: 600,
                      }}
                    >
                      Debit (Rs.)
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: COLORS.muted,
                        width: 150,
                        fontWeight: 600,
                      }}
                    >
                      Credit (Rs.)
                    </TableCell>

                    <TableCell
                      sx={{
                        width: 60,
                      }}
                    />
                  </TableRow>
                </TableHead>

                <TableBody>
                  {lines.map((line, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        bgcolor: COLORS.card,

                        "&:hover": {
                          bgcolor: COLORS.cardHover,
                        },

                        "& td": {
                          borderBottom: `1px solid ${COLORS.border}`,
                        },

                        "&:last-child td": {
                          borderBottom: "none",
                        },
                      }}
                    >
                      {/* Account */}
                      <TableCell>
                        <TextField
                          select
                          SelectProps={darkSelectProps}
                          variant="standard"
                          fullWidth
                          value={line.accountId}
                          onChange={(e) =>
                            updateLine(idx, {
                              accountId:
                                Number(
                                  e.target.value
                                ),
                            })
                          }
                          sx={darkTextFieldSx}
                        >
                          <MenuItem
                            value=""
                            disabled
                          >
                            Select Account
                          </MenuItem>

                          {accounts.data?.data.map(
                            (acc) => (
                              <MenuItem
                                key={acc.id}
                                value={acc.id}
                              >
                                {acc.name} (
                                {acc.code})
                              </MenuItem>
                            )
                          )}
                        </TextField>
                      </TableCell>

                      {/* Partner */}
                      <TableCell>
                        <TextField
                          select
                          SelectProps={darkSelectProps}
                          variant="standard"
                          fullWidth
                          value={line.partnerId}
                          onChange={(e) =>
                            updateLine(idx, {
                              partnerId:
                                e.target.value
                                  ? Number(
                                      e.target.value
                                    )
                                  : "",
                            })
                          }
                          sx={darkTextFieldSx}
                        >
                          <MenuItem value="">
                            None
                          </MenuItem>

                          {contacts.data?.data.map(
                            (contact) => (
                              <MenuItem
                                key={contact.id}
                                value={contact.id}
                              >
                                {contact.name}
                              </MenuItem>
                            )
                          )}
                        </TextField>
                      </TableCell>

                      {/* Debit */}
                      <TableCell align="right">
                        <TextField
                          type="number"
                          variant="standard"
                          value={
                            line.debit || ""
                          }
                          placeholder="0.00"
                          onChange={(e) =>
                            updateLine(idx, {
                              debit:
                                Number(
                                  e.target.value
                                ) || 0,
                              credit: 0,
                            })
                          }
                          sx={darkTextFieldSx}
                          inputProps={{
                            min: 0,
                            step: "0.01",
                            style: {
                              textAlign: "right",
                            },
                          }}
                        />
                      </TableCell>

                      {/* Credit */}
                      <TableCell align="right">
                        <TextField
                          type="number"
                          variant="standard"
                          value={
                            line.credit || ""
                          }
                          placeholder="0.00"
                          onChange={(e) =>
                            updateLine(idx, {
                              credit:
                                Number(
                                  e.target.value
                                ) || 0,
                              debit: 0,
                            })
                          }
                          sx={darkTextFieldSx}
                          inputProps={{
                            min: 0,
                            step: "0.01",
                            style: {
                              textAlign: "right",
                            },
                          }}
                        />
                      </TableCell>

                      {/* Delete */}
                      <TableCell>
                        <IconButton
                          size="small"
                          disabled={
                            lines.length <= 2
                          }
                          onClick={() =>
                            removeLine(idx)
                          }
                          sx={{
                            color: COLORS.muted,

                            "&:hover": {
                              color: COLORS.danger,
                              bgcolor:
                                COLORS.dangerSoft,
                            },

                            "&.Mui-disabled": {
                              color:
                                "rgba(148, 163, 184, 0.25)",
                            },
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Bottom Actions / Totals */}
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
            gap={3}
          >
            <Button
              startIcon={<AddIcon />}
              onClick={addLine}
              variant="outlined"
              sx={{
                alignSelf: {
                  xs: "flex-start",
                  sm: "auto",
                },
                color: COLORS.accent,
                borderColor: COLORS.borderStrong,
                borderRadius: 2,
                px: 2,
                py: 0.9,
                textTransform: "none",
                fontWeight: 600,

                "&:hover": {
                  bgcolor: COLORS.accentSoft,
                  borderColor: COLORS.accent,
                },
              }}
            >
              Add Line
            </Button>

            <Box
              sx={{
                bgcolor: COLORS.page,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 2.5,
                px: 2.5,
                py: 1.5,
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={{
                  xs: 1,
                  sm: 4,
                }}
              >
                <Typography
                  sx={{
                    color: isBalanced
                      ? COLORS.success
                      : COLORS.muted,
                  }}
                >
                  Total Debit:{" "}
                  <b>{formatMoney(totalDebit)}</b>
                </Typography>

                <Typography
                  sx={{
                    color: isBalanced
                      ? COLORS.success
                      : COLORS.muted,
                  }}
                >
                  Total Credit:{" "}
                  <b>{formatMoney(totalCredit)}</b>
                </Typography>

                {isBalanced && (
                  <Typography
                    sx={{
                      color: COLORS.success,
                      fontWeight: 600,
                    }}
                  >
                    Balanced
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  const renderedEntries =
    entries.data?.data ?? [];

  return (
    <DarkContainer title="Journal Entries">
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
          gap={2}
        >
          <CustomButton
            active
            onClick={openCreate}
          >
            New
          </CustomButton>

          <TextField
            variant="outlined"
            size="small"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{
              width: {
                xs: "100%",
                sm: 300,
              },

              "& .MuiInputBase-root": {
                color: COLORS.text,
              },

              "& input::placeholder": {
                color: COLORS.muted,
                opacity: 1,
              },

              "& .MuiOutlinedInput-root": {
                borderRadius: 2,

                "& fieldset": {
                  borderColor:
                    COLORS.borderStrong,
                },

                "&:hover fieldset": {
                  borderColor:
                    COLORS.accent,
                },

                "&.Mui-focused fieldset": {
                  borderColor:
                    COLORS.accent,
                },
              },
            }}
          />

          <CustomButton
            onClick={() =>
              window.history.back()
            }
          >
            Back
          </CustomButton>
        </Stack>

        {/* Content */}
        {entries.isLoading ? (
          <LoadingState label="Loading journal entries..." />
        ) : entries.isError ? (
          <ErrorState
            message={apiError(entries.error)}
            onRetry={() =>
              void entries.refetch()
            }
          />
        ) : renderedEntries.length === 0 ? (
          <EmptyState message="No journal entries found." />
        ) : (
          <TableContainer
            sx={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              overflowX: "auto",
            }}
          >
            <Table
              size="small"
              sx={{
                minWidth: 850,

                "& .MuiTableCell-root": {
                  px: 2,
                  py: 1.8,
                },
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: COLORS.page,

                    "& th": {
                      borderBottom: `1px solid ${COLORS.borderStrong}`,
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                    }}
                  >
                    Date
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                    }}
                  >
                    Number
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                    }}
                  >
                    Partner
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                    }}
                  >
                    Journal
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                    }}
                  >
                    Total
                  </TableCell>

                  <TableCell
                    sx={{
                      color: COLORS.muted,
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {renderedEntries.map((entry) => {
                  const partnerName =
                    entry.lines?.find(
                      (line) => line.partner
                    )?.partner?.name || "—";

                  const totalAmount =
                    entry.lines?.reduce(
                      (sum, line) =>
                        sum +
                        Number(line.debit),
                      0
                    ) || 0;

                  return (
                    <TableRow
                      key={entry.id}
                      component={RouterLink}
                      to={`/journal-entries/${entry.id}`}
                      sx={{
                        textDecoration: "none",
                        bgcolor: COLORS.card,
                        cursor: "pointer",

                        "&:hover": {
                          bgcolor:
                            COLORS.cardHover,
                        },

                        "& td": {
                          borderBottom: `1px solid ${COLORS.border}`,
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {new Date(
                          entry.entryDate
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.accent,
                          fontWeight: 700,
                        }}
                      >
                        {entry.entryNumber}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {partnerName}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: COLORS.text,
                        }}
                      >
                        {entry.journal.name}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.text,
                          fontWeight: 600,
                        }}
                      >
                        {formatMoney(
                          totalAmount
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={entry.status}
                          sx={{
                            bgcolor:
                              entry.status ===
                              "POSTED"
                                ? COLORS.successSoft
                                : COLORS.infoSoft,

                            color:
                              entry.status ===
                              "POSTED"
                                ? COLORS.success
                                : COLORS.info,

                            border: `1px solid ${
                              entry.status ===
                              "POSTED"
                                ? COLORS.success
                                : COLORS.info
                            }`,

                            borderRadius: 1.5,
                            fontWeight: 600,
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

        {/* Pagination */}
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
          spacing={2}
          pt={1}
        >
          <Typography
            variant="body2"
            sx={{
              color: COLORS.muted,
            }}
          >
            {entries.data?.meta.total ?? 0} entries
          </Typography>

          <Pagination
            page={page}
            count={Math.max(
              1,
              entries.data?.meta.totalPages ?? 1
            )}
            onChange={(_, value) =>
              setPage(value)
            }
            sx={{
              "& .MuiPaginationItem-root": {
                color: COLORS.muted,
                borderRadius: 1.5,
              },

              "& .MuiPaginationItem-root:hover": {
                bgcolor: COLORS.accentSoft,
                color: COLORS.accent,
              },

              "& .Mui-selected": {
                bgcolor: `${COLORS.accentSoft} !important`,
                color: `${COLORS.accent} !important`,
                fontWeight: 700,
              },
            }}
          />
        </Stack>
      </Stack>
    </DarkContainer>
  );
};  