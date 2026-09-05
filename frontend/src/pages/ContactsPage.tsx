import { useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { Alert, Box, Button, Checkbox, FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as contactsApi from "../api/contacts.api";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";
import { isSystemAdministrator } from "../features/auth/roles";
import { Country, State, City } from "country-state-city";

const blank: contactsApi.ContactInput = { name: "", type: "CUSTOMER", email: null, phone: null, address: null, profileImage: null };
const apiError = (error: unknown) => axios.isAxiosError<{ error?: string }>(error) ? error.response?.data?.error ?? "Request failed." : "Request failed.";

const DarkContainer = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pt: 4 }}>
    {title && (
      <Box sx={{ bgcolor: "#172642", border: "1px solid #2563eb", borderRadius: 2, py: 1, px: 3, mb: 3, display: "inline-block" }}>
        <Typography variant="h6" color="#7dd3fc" fontWeight={600}>{title}</Typography>
      </Box>
    )}
    <Box sx={{ border: "1px solid #263550", borderRadius: 6, p: 3, bgcolor: "#111c31" }}>
      {children}
    </Box>
  </Box>
);

const darkTextFieldSx = { 
  "& .MuiInputBase-root": { color: "rgba(255,255,255,0.9)" }, 
  "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.3)" }, 
  "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottomColor: "rgba(255,255,255,0.7)" }, 
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" }, 
  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.6)" },
  "& .MuiInputBase-input.Mui-disabled": { color: "rgba(255,255,255,0.3) !important", WebkitTextFillColor: "rgba(255,255,255,0.3) !important" },
  "& .MuiInputLabel-root.Mui-disabled": { color: "rgba(255,255,255,0.3) !important" },
  "& .MuiInput-underline.Mui-disabled:before": { borderBottomColor: "rgba(255,255,255,0.1) !important", borderBottomStyle: "solid" },
  "& .MuiSvgIcon-root.Mui-disabled": { color: "rgba(255,255,255,0.2) !important" }
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

export const ContactsPage = () => {
  const queryClient = useQueryClient(); const { user } = useAuth();
  const canManage = isSystemAdministrator(user?.role);
  const [screen, setScreen] = useState<"list" | "form">("list"); const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const [form, setForm] = useState<contactsApi.ContactInput>(blank); const [editing, setEditing] = useState<contactsApi.Contact | null>(null);
  const params = useMemo(() => ({ search: search || undefined, page, pageSize: 10 }), [search, page]);
  const contacts = useQuery({ queryKey: ["contacts", params], queryFn: () => contactsApi.getContacts(params) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["contacts"] });
  
  const save = useMutation({ 
    mutationFn: (payload: contactsApi.ContactInput) => editing 
      ? contactsApi.updateContact({ id: editing.id, input: payload }) 
      : contactsApi.createContact(payload), 
    onSuccess: () => { setScreen("list"); setEditing(null); setForm(blank); setAddressParts({ street: "", city: "", stateCode: "", countryCode: "", pincode: "" }); refresh(); } 
  });
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addressParts, setAddressParts] = useState({ street: "", city: "", stateCode: "", countryCode: "", pincode: "" });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => (ids.length === 1 ? contactsApi.deleteContact(ids[0]) : contactsApi.deleteContactsBulk(ids)),
    onSuccess: () => {
      setSelectedIds([]);
      refresh();
    }
  });

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected contact(s)?`)) {
      deleteMutation.mutate(selectedIds);
    }
  };

  const openCreate = () => { setEditing(null); setForm(blank); setValidationError(null); setAddressParts({ street: "", city: "", stateCode: "", countryCode: "", pincode: "" }); setScreen("form"); };
  const openRecord = (contact: contactsApi.Contact) => { 
    setEditing(contact); 
    setForm({ name: contact.name, type: contact.type, email: contact.email, phone: contact.phone, address: contact.address, profileImage: contact.profileImage }); 
    
    try {
      if (contact.address && contact.address.startsWith("{")) {
        setAddressParts(JSON.parse(contact.address));
      } else {
        setAddressParts({ street: contact.address || "", city: "", stateCode: "", countryCode: "", pincode: "" });
      }
    } catch {
      setAddressParts({ street: contact.address || "", city: "", stateCode: "", countryCode: "", pincode: "" });
    }
    
    setValidationError(null);
    setScreen("form"); 
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const submit = (event: FormEvent) => { 
    event.preventDefault(); 
    
    if (!form.name || form.name.trim().length < 2) {
      setValidationError("Name must be at least 2 characters long.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    if (form.phone && !/^\+?\d{7,15}$/.test(form.phone)) {
      setValidationError("Please enter a valid phone number (digits only, optional leading +).");
      return;
    }
    
    setValidationError(null);
    
    const emptyAddress = { street: "", city: "", stateCode: "", countryCode: "", pincode: "" };
    const isAddressEmpty = JSON.stringify(addressParts) === JSON.stringify(emptyAddress);
    const combinedAddress = isAddressEmpty ? null : JSON.stringify(addressParts);
    
    save.mutate({ ...form, address: combinedAddress }); 
  };

  const renderedContacts = contacts.data?.data ?? [];
  const isAllSelected = renderedContacts.length > 0 && selectedIds.length === renderedContacts.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < renderedContacts.length;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(renderedContacts.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  if (screen === "form") return (
    <DarkContainer>
      <Stack component="form" onSubmit={submit} spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <CustomButton type="submit" disabled={save.isPending}>{save.isPending ? "..." : "Confirm"}</CustomButton>
          </Stack>
          <CustomButton onClick={() => { setScreen("list"); setEditing(null); }}>Back</CustomButton>
        </Stack>
        
        {validationError && <Alert severity="warning">{validationError}</Alert>}
        {save.isError && <Alert severity="error">{apiError(save.error)}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={6}>
          <Stack spacing={2} flex={1}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={120}>Contact Name</Typography>
              <TextField variant="standard" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required sx={darkTextFieldSx} />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={120}>Email</Typography>
              <TextField variant="standard" type="email" fullWidth value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value || null })} sx={darkTextFieldSx} />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={120}>Phone</Typography>
              <TextField variant="standard" fullWidth value={form.phone ?? ""} onChange={(e) => {
                const numericValue = e.target.value.replace(/[^\d+]/g, '');
                setForm({ ...form, phone: numericValue || null });
              }} sx={darkTextFieldSx} />
            </Stack>
            
            <Typography color="white" pt={2}>Address</Typography>
            <Stack spacing={2} pl={4}>
              <TextField select SelectProps={darkSelectProps} variant="standard" label="Country" fullWidth value={addressParts.countryCode} onChange={(e) => setAddressParts({ ...addressParts, countryCode: e.target.value, stateCode: "", city: "" })} sx={darkTextFieldSx}>
                {Country.getAllCountries().map(country => (
                  <MenuItem key={country.isoCode} value={country.isoCode}>{country.name}</MenuItem>
                ))}
              </TextField>

              <TextField select SelectProps={darkSelectProps} variant="standard" label="State" fullWidth value={addressParts.stateCode} onChange={(e) => setAddressParts({ ...addressParts, stateCode: e.target.value, city: "" })} disabled={!addressParts.countryCode} sx={darkTextFieldSx}>
                {addressParts.countryCode && State.getStatesOfCountry(addressParts.countryCode).length > 0 ? State.getStatesOfCountry(addressParts.countryCode).map(state => (
                  <MenuItem key={state.isoCode} value={state.isoCode}>{state.name}</MenuItem>
                )) : <MenuItem value="" disabled>{addressParts.countryCode ? "No states found" : "Select Country first"}</MenuItem>}
              </TextField>

              <TextField select SelectProps={darkSelectProps} variant="standard" label="City" fullWidth value={addressParts.city} onChange={(e) => setAddressParts({ ...addressParts, city: e.target.value })} disabled={!addressParts.stateCode} sx={darkTextFieldSx}>
                {addressParts.stateCode && City.getCitiesOfState(addressParts.countryCode, addressParts.stateCode).length > 0 ? City.getCitiesOfState(addressParts.countryCode, addressParts.stateCode).map((city, idx) => (
                  <MenuItem key={`${city.name}-${idx}`} value={city.name}>{city.name}</MenuItem>
                )) : <MenuItem value="" disabled>{addressParts.stateCode ? "No cities found" : "Select State first"}</MenuItem>}
              </TextField>

              <TextField variant="standard" label="Street" fullWidth value={addressParts.street} onChange={(e) => setAddressParts({ ...addressParts, street: e.target.value })} sx={darkTextFieldSx} />
              
              <TextField variant="standard" label="Pincode" sx={{ width: "50%", ...darkTextFieldSx }} value={addressParts.pincode} onChange={(e) => setAddressParts({ ...addressParts, pincode: e.target.value })} />
            </Stack>
          </Stack>

          <Box component="label" sx={{ width: 200, height: 200, border: "1px dashed rgba(255,255,255,0.3)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", "&:hover": { borderColor: "white" } }}>
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
            {form.profileImage ? (
              <Box component="img" src={form.profileImage} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Typography color="rgba(255,255,255,0.5)">Upload Image</Typography>
            )}
          </Box>
        </Stack>
      </Stack>
    </DarkContainer>
  );

  return (
    <DarkContainer title="Master Data">
  <Stack spacing={3}>
    {/* Top Actions */}
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Stack direction="row" spacing={2} alignItems="center">
        {/* New Button */}
        <CustomButton onClick={openCreate}>
          New
        </CustomButton>

        {/* Bulk Delete */}
        {selectedIds.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleDeleteSelected}
            disabled={deleteMutation.isPending}
            sx={{
              px: 1.5,
              py: 0.65,
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              color: "#ff6b6b",
              borderColor: "rgba(255,107,107,0.5)",
              backgroundColor: "rgba(255,107,107,0.04)",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(255,107,107,0.12)",
                borderColor: "#ff6b6b",
              },
              "&.Mui-disabled": {
                color: "rgba(255,107,107,0.4)",
                borderColor: "rgba(255,107,107,0.2)",
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
        placeholder="Search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        sx={{
          width: 300,
          input: {
            color: "white",
          },
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "rgba(255,255,255,0.3)",
            },
            "&:hover fieldset": {
              borderColor: "white",
            },
            "&.Mui-focused fieldset": {
              borderColor: "rgba(255,255,255,0.7)",
            },
          },
        }}
      />

      {/* Back + View Toggle */}
      <Stack direction="row" spacing={2} alignItems="center">
        <CustomButton onClick={() => setScreen("list")}>
          Back
        </CustomButton>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, next) => next && setView(next)}
          sx={{
            bgcolor: "white",
            borderRadius: 1.5,
            overflow: "hidden",
          }}
        >
          <ToggleButton value="list">
            <ViewListIcon sx={{ color: "black" }} />
          </ToggleButton>

          <ToggleButton value="kanban">
            <ViewModuleIcon sx={{ color: "black" }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Stack>

    {/* Delete Error */}
    {deleteMutation.isError && (
      <Alert severity="error">
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
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    borderBottom:
                      "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {/* Select All */}
                  <TableCell
                    sx={{
                      color: "white",
                      borderBottom: "none",
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={(e) =>
                        toggleSelectAll(e.target.checked)
                      }
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        "&.Mui-checked": {
                          color: "#90EE90",
                        },
                        "&.MuiCheckbox-indeterminate": {
                          color: "#90EE90",
                        },
                      }}
                    />
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "white",
                      borderBottom: "none",
                    }}
                  >
                    Image
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "white",
                      borderBottom: "none",
                    }}
                  >
                    Name
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "white",
                      borderBottom: "none",
                    }}
                  >
                    Email
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "white",
                      borderBottom: "none",
                    }}
                  >
                    Phone
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      color: "white",
                      borderBottom: "none",
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
                    onClick={() => openRecord(contact)}
                    sx={{
                      cursor: "pointer",
                      borderBottom:
                        "1px solid rgba(255,255,255,0.1)",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.05)",
                      },
                    }}
                  >
                    {/* Checkbox */}
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(contact.id)}
                        onChange={() =>
                          toggleSelectRow(contact.id)
                        }
                        sx={{
                          color: "rgba(255,255,255,0.5)",
                          "&.Mui-checked": {
                            color: "#90EE90",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Image */}
                    <TableCell
                      sx={{
                        borderBottom: "none",
                      }}
                    >
                      {contact.profileImage ? (
                        <Box
                          component="img"
                          src={contact.profileImage}
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <AccountCircleIcon
                          sx={{
                            color: "rgba(255,255,255,0.3)",
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Name */}
                    <TableCell
                      sx={{
                        color: "white",
                        borderBottom: "none",
                      }}
                    >
                      {contact.name}
                    </TableCell>

                    {/* Email */}
                    <TableCell
                      sx={{
                        color: "white",
                        borderBottom: "none",
                      }}
                    >
                      {contact.email ?? "—"}
                    </TableCell>

                    {/* Phone */}
                    <TableCell
                      sx={{
                        color: "white",
                        borderBottom: "none",
                      }}
                    >
                      {contact.phone ?? "—"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell
                      align="right"
                      sx={{
                        borderBottom: "none",
                      }}
                    >
                      {canManage && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
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
                            color: "#ff6b6b",
                            borderColor:
                              "rgba(255,107,107,0.5)",
                            backgroundColor:
                              "rgba(255,107,107,0.04)",
                            transition: "all 0.2s ease",

                            "&:hover": {
                              backgroundColor:
                                "rgba(255,107,107,0.12)",
                              borderColor: "#ff6b6b",
                            },

                            "&.Mui-disabled": {
                              color:
                                "rgba(255,107,107,0.4)",
                              borderColor:
                                "rgba(255,107,107,0.2)",
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
              pt: 2,
            }}
          >
            {renderedContacts.map((contact) => (
              <Paper
                key={contact.id}
                variant="outlined"
                onClick={() => openRecord(contact)}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  bgcolor: "transparent",
                  borderColor:
                    "rgba(255,255,255,0.3)",
                  borderRadius: 3,
                  transition: "all 0.2s ease",

                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.7)",
                    bgcolor: "rgba(255,255,255,0.03)",
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {/* Contact Info */}
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ minWidth: 0 }}
                  >
                    {/* Profile Image */}
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        flexShrink: 0,
                        bgcolor:
                          "rgba(255,255,255,0.1)",
                        borderRadius: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
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
                            color:
                              "rgba(255,255,255,0.3)",
                          }}
                        />
                      )}
                    </Box>

                    {/* Details */}
                    <Stack sx={{ minWidth: 0 }}>
                      <Typography
                        color="white"
                        fontWeight={600}
                        noWrap
                      >
                        {contact.name}
                      </Typography>

                      <Typography
                        color="rgba(255,255,255,0.7)"
                        variant="body2"
                        noWrap
                      >
                        {contact.email ?? "No email"}
                      </Typography>

                      <Typography
                        color="rgba(255,255,255,0.7)"
                        variant="body2"
                        noWrap
                      >
                        {contact.phone ?? "No phone"}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Delete Button */}
                  {canManage && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
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
                        color: "#ff6b6b",
                        borderColor:
                          "rgba(255,107,107,0.5)",
                        backgroundColor:
                          "rgba(255,107,107,0.04)",
                        transition: "all 0.2s ease",

                        "&:hover": {
                          backgroundColor:
                            "rgba(255,107,107,0.12)",
                          borderColor: "#ff6b6b",
                        },

                        "&.Mui-disabled": {
                          color:
                            "rgba(255,107,107,0.4)",
                          borderColor:
                            "rgba(255,107,107,0.2)",
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
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography
        variant="body2"
        color="rgba(255,255,255,0.5)"
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
            color: "white",
          },
        }}
      />
    </Box>
  </Stack>
</DarkContainer>
  );
};
