import { useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  MenuItem,
  Pagination,
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
import * as contactsApi from "../api/contacts.api";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";
import { isSystemAdministrator } from "../features/auth/roles";
import { Country, State, City } from "country-state-city";

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

const blank: contactsApi.ContactInput = {
  name: "",
  type: "CUSTOMER",
  email: null,
  phone: null,
  address: null,
  profileImage: null,
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
  "& .MuiInputBase-input.Mui-disabled": {
    color: `${COLORS.muted} !important`,
    WebkitTextFillColor: `${COLORS.muted} !important`,
  },
  "& .MuiInputLabel-root.Mui-disabled": {
    color: `${COLORS.muted} !important`,
  },
  "& .MuiInput-underline.Mui-disabled:before": {
    borderBottomColor: `${COLORS.border} !important`,
  },
  "& .MuiSvgIcon-root.Mui-disabled": {
    color: `${COLORS.muted} !important`,
  },
};

const darkSelectProps = {
  MenuProps: {
    PaperProps: {
      sx: {
        bgcolor: COLORS.cardHover,
        color: COLORS.text,
        maxHeight: 300,
        border: `1px solid ${COLORS.border}`,
        "& .MuiMenuItem-root:hover": {
          bgcolor: COLORS.accentSoft,
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
      color: active ? "white" : COLORS.text,
      bgcolor: active ? COLORS.accent : "transparent",
      borderColor: active
        ? COLORS.accent
        : COLORS.borderStrong,
      borderRadius: 2,
      textTransform: "none",
      minWidth: 80,
      fontWeight: 600,
      boxShadow: "none",
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

export const ContactsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canManage = isSystemAdministrator(user?.role);

  const [screen, setScreen] = useState<"list" | "form">("list");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] =
    useState<contactsApi.ContactInput>(blank);

  const [editing, setEditing] =
    useState<contactsApi.Contact | null>(null);

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const [addressParts, setAddressParts] = useState({
    street: "",
    city: "",
    stateCode: "",
    countryCode: "",
    pincode: "",
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      page,
      pageSize: 10,
    }),
    [search, page]
  );

  const contacts = useQuery({
    queryKey: ["contacts", params],
    queryFn: () => contactsApi.getContacts(params),
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["contacts"],
    });

  const save = useMutation({
    mutationFn: (payload: contactsApi.ContactInput) =>
      editing
        ? contactsApi.updateContact({
            id: editing.id,
            input: payload,
          })
        : contactsApi.createContact(payload),

    onSuccess: () => {
      setScreen("list");
      setEditing(null);
      setForm(blank);

      setAddressParts({
        street: "",
        city: "",
        stateCode: "",
        countryCode: "",
        pincode: "",
      });

      refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) =>
      ids.length === 1
        ? contactsApi.deleteContact(ids[0])
        : contactsApi.deleteContactsBulk(ids),

    onSuccess: () => {
      setSelectedIds([]);
      refresh();
    },
  });

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected contact(s)?`
      )
    ) {
      deleteMutation.mutate(selectedIds);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setValidationError(null);

    setAddressParts({
      street: "",
      city: "",
      stateCode: "",
      countryCode: "",
      pincode: "",
    });

    setScreen("form");
  };

  const openRecord = (contact: contactsApi.Contact) => {
    setEditing(contact);

    setForm({
      name: contact.name,
      type: contact.type,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      profileImage: contact.profileImage,
    });

    try {
      if (contact.address && contact.address.startsWith("{")) {
        setAddressParts(JSON.parse(contact.address));
      } else {
        setAddressParts({
          street: contact.address || "",
          city: "",
          stateCode: "",
          countryCode: "",
          pincode: "",
        });
      }
    } catch {
      setAddressParts({
        street: contact.address || "",
        city: "",
        stateCode: "",
        countryCode: "",
        pincode: "",
      });
    }

    setValidationError(null);
    setScreen("form");
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          profileImage: reader.result as string,
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!form.name || form.name.trim().length < 2) {
      setValidationError(
        "Name must be at least 2 characters long."
      );
      return;
    }

    if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      setValidationError(
        "Please enter a valid email address."
      );
      return;
    }

    if (
      form.phone &&
      !/^\+?\d{7,15}$/.test(form.phone)
    ) {
      setValidationError(
        "Please enter a valid phone number (digits only, optional leading +)."
      );
      return;
    }

    setValidationError(null);

    const emptyAddress = {
      street: "",
      city: "",
      stateCode: "",
      countryCode: "",
      pincode: "",
    };

    const isAddressEmpty =
      JSON.stringify(addressParts) ===
      JSON.stringify(emptyAddress);

    const combinedAddress = isAddressEmpty
      ? null
      : JSON.stringify(addressParts);

    save.mutate({
      ...form,
      address: combinedAddress,
    });
  };

  const renderedContacts = contacts.data?.data ?? [];

  const isAllSelected =
    renderedContacts.length > 0 &&
    selectedIds.length === renderedContacts.length;

  const isSomeSelected =
    selectedIds.length > 0 &&
    selectedIds.length < renderedContacts.length;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(renderedContacts.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  if (screen === "form") {
    return (
      <DarkContainer>
        <Stack
          component="form"
          onSubmit={submit}
          spacing={4}
        >
          {/* Form Header */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            gap={2}
          >
            <Typography
              variant="h6"
              sx={{
                color: COLORS.text,
                fontWeight: 700,
              }}
            >
              {editing ? "Edit Contact" : "New Contact"}
            </Typography>

            <Stack direction="row" spacing={1.5}>
              <CustomButton
                type="submit"
                disabled={save.isPending || !canManage}
                active
              >
                {save.isPending ? "Saving..." : "Confirm"}
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
          </Stack>

          {validationError && (
            <Alert
              severity="warning"
              sx={{
                bgcolor: COLORS.warningSoft,
                color: COLORS.warning,
                border: `1px solid rgba(217,184,108,0.2)`,
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
                border: `1px solid rgba(233,139,139,0.2)`,
                "& .MuiAlert-icon": {
                  color: COLORS.danger,
                },
              }}
            >
              {apiError(save.error)}
            </Alert>
          )}

          {/* Form Content */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 4, md: 6 }}
          >
            <Stack spacing={2.5} flex={1}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.text,
                    minWidth: 120,
                    fontWeight: 500,
                  }}
                >
                  Contact Name
                </Typography>

                <TextField
                  variant="standard"
                  fullWidth
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
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.text,
                    minWidth: 120,
                    fontWeight: 500,
                  }}
                >
                  Email
                </Typography>

                <TextField
                  variant="standard"
                  type="email"
                  fullWidth
                  value={form.email ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value || null,
                    })
                  }
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
              >
                <Typography
                  sx={{
                    color: COLORS.text,
                    minWidth: 120,
                    fontWeight: 500,
                  }}
                >
                  Phone
                </Typography>

                <TextField
                  variant="standard"
                  fullWidth
                  value={form.phone ?? ""}
                  onChange={(e) => {
                    const numericValue =
                      e.target.value.replace(/[^\d+]/g, "");

                    setForm({
                      ...form,
                      phone: numericValue || null,
                    });
                  }}
                  sx={darkTextFieldSx}
                />
              </Stack>

              <Typography
                sx={{
                  color: COLORS.text,
                  fontWeight: 600,
                  pt: 1,
                }}
              >
                Address
              </Typography>

              <Stack spacing={2} pl={{ xs: 0, sm: 4 }}>
                <TextField
                  select
                  SelectProps={darkSelectProps}
                  variant="standard"
                  label="Country"
                  fullWidth
                  value={addressParts.countryCode}
                  onChange={(e) =>
                    setAddressParts({
                      ...addressParts,
                      countryCode: e.target.value,
                      stateCode: "",
                      city: "",
                    })
                  }
                  sx={darkTextFieldSx}
                >
                  {Country.getAllCountries().map(
                    (country) => (
                      <MenuItem
                        key={country.isoCode}
                        value={country.isoCode}
                      >
                        {country.name}
                      </MenuItem>
                    )
                  )}
                </TextField>

                <TextField
                  select
                  SelectProps={darkSelectProps}
                  variant="standard"
                  label="State"
                  fullWidth
                  value={addressParts.stateCode}
                  onChange={(e) =>
                    setAddressParts({
                      ...addressParts,
                      stateCode: e.target.value,
                      city: "",
                    })
                  }
                  disabled={!addressParts.countryCode}
                  sx={darkTextFieldSx}
                >
                  {addressParts.countryCode &&
                  State.getStatesOfCountry(
                    addressParts.countryCode
                  ).length > 0 ? (
                    State.getStatesOfCountry(
                      addressParts.countryCode
                    ).map((state) => (
                      <MenuItem
                        key={state.isoCode}
                        value={state.isoCode}
                      >
                        {state.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      {addressParts.countryCode
                        ? "No states found"
                        : "Select Country first"}
                    </MenuItem>
                  )}
                </TextField>

                <TextField
                  select
                  SelectProps={darkSelectProps}
                  variant="standard"
                  label="City"
                  fullWidth
                  value={addressParts.city}
                  onChange={(e) =>
                    setAddressParts({
                      ...addressParts,
                      city: e.target.value,
                    })
                  }
                  disabled={!addressParts.stateCode}
                  sx={darkTextFieldSx}
                >
                  {addressParts.stateCode &&
                  City.getCitiesOfState(
                    addressParts.countryCode,
                    addressParts.stateCode
                  ).length > 0 ? (
                    City.getCitiesOfState(
                      addressParts.countryCode,
                      addressParts.stateCode
                    ).map((city, idx) => (
                      <MenuItem
                        key={`${city.name}-${idx}`}
                        value={city.name}
                      >
                        {city.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      {addressParts.stateCode
                        ? "No cities found"
                        : "Select State first"}
                    </MenuItem>
                  )}
                </TextField>

                <TextField
                  variant="standard"
                  label="Street"
                  fullWidth
                  value={addressParts.street}
                  onChange={(e) =>
                    setAddressParts({
                      ...addressParts,
                      street: e.target.value,
                    })
                  }
                  sx={darkTextFieldSx}
                />

                <TextField
                  variant="standard"
                  label="Pincode"
                  sx={{
                    width: { xs: "100%", sm: "50%" },
                    ...darkTextFieldSx,
                  }}
                  value={addressParts.pincode}
                  onChange={(e) =>
                    setAddressParts({
                      ...addressParts,
                      pincode: e.target.value,
                    })
                  }
                />
              </Stack>
            </Stack>

            {/* Profile Image */}
            <Box
              component="label"
              sx={{
                width: { xs: "100%", sm: 200 },
                height: 200,
                alignSelf: { xs: "center", md: "flex-start" },
                border: `1px dashed ${COLORS.borderStrong}`,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                bgcolor: COLORS.page,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: COLORS.accent,
                  bgcolor: COLORS.accentSoft,
                },
              }}
            >
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />

              {form.profileImage ? (
                <Box
                  component="img"
                  src={form.profileImage}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Stack
                  alignItems="center"
                  spacing={1}
                >
                  <AccountCircleIcon
                    sx={{
                      fontSize: 44,
                      color: COLORS.muted,
                    }}
                  />

                  <Typography
                    sx={{
                      color: COLORS.muted,
                      fontSize: "0.9rem",
                    }}
                  >
                    Upload Image
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
        </Stack>
      </DarkContainer>
    );
  }

  return (
    <DarkContainer title="Contacts">
      <Stack spacing={4}>
        {/* Top Actions */}
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
          gap={2}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <CustomButton
              onClick={openCreate}
              disabled={!canManage}
              active
            >
              New
            </CustomButton>

            {selectedIds.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleDeleteSelected}
                disabled={
                  deleteMutation.isPending || !canManage
                }
                sx={{
                  px: 1.5,
                  py: 0.65,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: COLORS.danger,
                  borderColor:
                    "rgba(233,139,139,0.5)",
                  bgcolor: COLORS.dangerSoft,
                  "&:hover": {
                    bgcolor:
                      "rgba(233,139,139,0.16)",
                    borderColor: COLORS.danger,
                  },
                }}
              >
                Delete ({selectedIds.length})
              </Button>
            )}
          </Stack>

          {/* Search */}
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search contacts"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            sx={{
              width: { xs: "100%", lg: 300 },
              "& .MuiOutlinedInput-root": {
                color: COLORS.text,
                bgcolor: COLORS.page,
                borderRadius: 2,
                "& fieldset": {
                  borderColor: COLORS.borderStrong,
                },
                "&:hover fieldset": {
                  borderColor: COLORS.accent,
                },
                "&.Mui-focused fieldset": {
                  borderColor: COLORS.accent,
                },
              },
              "& input::placeholder": {
                color: COLORS.muted,
                opacity: 1,
              },
            }}
          />

          {/* Navigation / View Toggle */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <CustomButton
              onClick={() => setScreen("list")}
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
                bgcolor: COLORS.page,
                border: `1px solid ${COLORS.borderStrong}`,
                borderRadius: 1.5,
                overflow: "hidden",
                "& .MuiToggleButton-root": {
                  color: COLORS.muted,
                  border: "none",
                  px: 1.25,
                },
                "& .Mui-selected": {
                  bgcolor: COLORS.accentSoft,
                  color: COLORS.accent,
                },
                "& .MuiToggleButton-root:hover": {
                  bgcolor: COLORS.accentSoft,
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

        {/* Delete Error */}
        {deleteMutation.isError && (
          <Alert
            severity="error"
            sx={{
              bgcolor: COLORS.dangerSoft,
              color: COLORS.danger,
              border: `1px solid rgba(233,139,139,0.2)`,
              "& .MuiAlert-icon": {
                color: COLORS.danger,
              },
            }}
          >
            {apiError(deleteMutation.error)}
          </Alert>
        )}

        {/* Content */}
        {contacts.isLoading ? (
          <LoadingState label="Loading contacts..." />
        ) : contacts.isError ? (
          <ErrorState
            message={apiError(contacts.error)}
            onRetry={() => void contacts.refetch()}
          />
        ) : renderedContacts.length === 0 ? (
          <EmptyState message="No contacts found." />
        ) : (
          <>
            {/* LIST VIEW */}
            {view === "list" ? (
              <TableContainer
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 2.5,
                  overflow: "hidden",
                  bgcolor: COLORS.page,
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: COLORS.cardHover,
                      }}
                    >
                      <TableCell
                        sx={{
                          color: COLORS.muted,
                          borderBottom: `1px solid ${COLORS.border}`,
                          py: 1.75,
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={isAllSelected}
                          indeterminate={isSomeSelected}
                          onChange={(e) =>
                            toggleSelectAll(
                              e.target.checked
                            )
                          }
                          sx={{
                            color: COLORS.muted,
                            "&.Mui-checked": {
                              color: COLORS.accent,
                            },
                            "&.MuiCheckbox-indeterminate": {
                              color: COLORS.accent,
                            },
                          }}
                        />
                      </TableCell>

                      {[
                        "Image",
                        "Name",
                        "Email",
                        "Phone",
                      ].map((heading) => (
                        <TableCell
                          key={heading}
                          sx={{
                            color: COLORS.muted,
                            borderBottom: `1px solid ${COLORS.border}`,
                            fontWeight: 700,
                            py: 1.75,
                          }}
                        >
                          {heading}
                        </TableCell>
                      ))}

                      <TableCell
                        align="right"
                        sx={{
                          color: COLORS.muted,
                          borderBottom: `1px solid ${COLORS.border}`,
                          fontWeight: 700,
                          py: 1.75,
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {renderedContacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        hover
                        onClick={() =>
                          openRecord(contact)
                        }
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: COLORS.cardHover,
                          },
                          "& td": {
                            borderBottom: `1px solid ${COLORS.border}`,
                          },
                        }}
                      >
                        <TableCell
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >
                          <Checkbox
                            size="small"
                            checked={selectedIds.includes(
                              contact.id
                            )}
                            onChange={() =>
                              toggleSelectRow(
                                contact.id
                              )
                            }
                            sx={{
                              color: COLORS.muted,
                              "&.Mui-checked": {
                                color: COLORS.accent,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          {contact.profileImage ? (
                            <Box
                              component="img"
                              src={contact.profileImage}
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: `1px solid ${COLORS.borderStrong}`,
                              }}
                            />
                          ) : (
                            <AccountCircleIcon
                              sx={{
                                fontSize: 36,
                                color: COLORS.muted,
                              }}
                            />
                          )}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: COLORS.text,
                            fontWeight: 600,
                          }}
                        >
                          {contact.name}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: COLORS.muted,
                          }}
                        >
                          {contact.email ?? "—"}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: COLORS.muted,
                          }}
                        >
                          {contact.phone ?? "—"}
                        </TableCell>

                        <TableCell align="right">
                          {canManage && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();

                                if (
                                  window.confirm(
                                    `Delete ${contact.name}?`
                                  )
                                ) {
                                  deleteMutation.mutate([
                                    contact.id,
                                  ]);
                                }
                              }}
                              sx={{
                                minWidth: 72,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1.5,
                                textTransform: "none",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: COLORS.danger,
                                borderColor:
                                  "rgba(233,139,139,0.5)",
                                bgcolor:
                                  COLORS.dangerSoft,
                                "&:hover": {
                                  bgcolor:
                                    "rgba(233,139,139,0.16)",
                                  borderColor:
                                    COLORS.danger,
                                },
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              /* KANBAN VIEW */
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 3,
                }}
              >
                {renderedContacts.map((contact) => (
                  <Paper
                    key={contact.id}
                    variant="outlined"
                    onClick={() =>
                      openRecord(contact)
                    }
                    sx={{
                      p: 2.5,
                      cursor: "pointer",
                      bgcolor: COLORS.page,
                      borderColor: COLORS.border,
                      borderRadius: 2.5,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: COLORS.accent,
                        bgcolor: COLORS.cardHover,
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            flexShrink: 0,
                            bgcolor: COLORS.cardHover,
                            borderRadius: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            border: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {contact.profileImage ? (
                            <Box
                              component="img"
                              src={contact.profileImage}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <AccountCircleIcon
                              sx={{
                                fontSize: 40,
                                color: COLORS.muted,
                              }}
                            />
                          )}
                        </Box>

                        <Stack sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: COLORS.text,
                              fontWeight: 700,
                            }}
                            noWrap
                          >
                            {contact.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color: COLORS.muted,
                            }}
                            noWrap
                          >
                            {contact.email ?? "No email"}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color: COLORS.muted,
                            }}
                            noWrap
                          >
                            {contact.phone ?? "No phone"}
                          </Typography>
                        </Stack>
                      </Stack>

                      {canManage && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();

                            if (
                              window.confirm(
                                `Delete ${contact.name}?`
                              )
                            ) {
                              deleteMutation.mutate([
                                contact.id,
                              ]);
                            }
                          }}
                          sx={{
                            minWidth: 72,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1.5,
                            textTransform: "none",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            flexShrink: 0,
                            color: COLORS.danger,
                            borderColor:
                              "rgba(233,139,139,0.5)",
                            bgcolor:
                              COLORS.dangerSoft,
                            "&:hover": {
                              bgcolor:
                                "rgba(233,139,139,0.16)",
                              borderColor:
                                COLORS.danger,
                            },
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Pagination */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={2}
        >
          <Typography
            variant="body2"
            sx={{ color: COLORS.muted }}
          >
            {contacts.data?.meta.total ?? 0} records
          </Typography>

          <Pagination
            page={page}
            count={Math.max(
              1,
              contacts.data?.meta.totalPages ?? 1
            )}
            onChange={(_, value) => setPage(value)}
            sx={{
              "& .MuiPaginationItem-root": {
                color: COLORS.muted,
              },
              "& .MuiPaginationItem-root.Mui-selected": {
                bgcolor: COLORS.accent,
                color: "#081312",
                fontWeight: 700,
              },
              "& .MuiPaginationItem-root:hover": {
                bgcolor: COLORS.accentSoft,
              },
            }}
          />
        </Stack>
      </Stack>
    </DarkContainer>
  );
};