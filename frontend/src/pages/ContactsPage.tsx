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

const blank: contactsApi.ContactInput = { name: "", type: "CUSTOMER", email: null, phone: null, address: null };
const apiError = (error: unknown) => axios.isAxiosError<{ error?: string }>(error) ? error.response?.data?.error ?? "Request failed." : "Request failed.";

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

const CustomButton = ({ children, onClick, active, disabled }: any) => (
  <Button 
    variant="outlined" 
    onClick={onClick}
    disabled={disabled}
    sx={{ 
      color: active ? "black" : "white", 
      bgcolor: active ? "white" : "transparent",
      borderColor: "rgba(255,255,255,0.5)", 
      borderRadius: 2, 
      textTransform: "none",
      minWidth: 80,
      "&:hover": { bgcolor: active ? "white" : "rgba(255,255,255,0.1)", borderColor: "white" }
    }}
  >
    {children}
  </Button>
);

export const ContactsPage = () => {
  const queryClient = useQueryClient(); const { user } = useAuth();
  const canManage = ["Admin", "Accountant", "Sales", "Purchase"].includes(user?.role ?? "");
  const [screen, setScreen] = useState<"list" | "form">("list"); const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const [form, setForm] = useState<contactsApi.ContactInput>(blank); const [editing, setEditing] = useState<contactsApi.Contact | null>(null);
  const params = useMemo(() => ({ search: search || undefined, page, pageSize: 10 }), [search, page]);
  const contacts = useQuery({ queryKey: ["contacts", params], queryFn: () => contactsApi.getContacts(params) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["contacts"] });
  
  const save = useMutation({ 
    mutationFn: () => editing ? contactsApi.updateContact({ id: editing.id, input: form }) : contactsApi.createContact(form), 
    onSuccess: () => { setScreen("list"); setEditing(null); setForm(blank); refresh(); } 
  });
  
  const openCreate = () => { setEditing(null); setForm(blank); setScreen("form"); };
  const openRecord = (contact: contactsApi.Contact) => { 
    setEditing(contact); 
    setForm({ name: contact.name, type: contact.type, email: contact.email, phone: contact.phone, address: contact.address }); 
    setScreen("form"); 
  };
  
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(); };

  if (screen === "form") return (
    <DarkContainer>
      <Stack component="form" onSubmit={submit} spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <CustomButton onClick={openCreate} active={!editing}>New</CustomButton>
            <CustomButton type="submit" disabled={save.isPending}>{save.isPending ? "..." : "Confirm"}</CustomButton>
          </Stack>
          <CustomButton onClick={() => { setScreen("list"); setEditing(null); }}>Back</CustomButton>
        </Stack>
        
        {save.isError && <Alert severity="error">{apiError(save.error)}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={6}>
          <Stack spacing={2} flex={1}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={120}>Contact Name</Typography>
              <TextField variant="standard" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required sx={{ input: { color: "white" }, "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.5)" } }} />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={120}>Email</Typography>
              <TextField variant="standard" type="email" fullWidth value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value || null })} sx={{ input: { color: "white" }, "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.5)" } }} />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography color="white" minWidth={120}>Phone</Typography>
              <TextField variant="standard" fullWidth value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value || null })} sx={{ input: { color: "white" }, "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.5)" } }} />
            </Stack>
            
            <Typography color="white" pt={2}>Address</Typography>
            <Stack spacing={2} pl={4}>
              {["Street", "City", "State", "Country"].map((field) => (
                <TextField key={field} variant="standard" placeholder={field} fullWidth value={field === "Street" ? (form.address ?? "") : ""} onChange={(e) => field === "Street" && setForm({ ...form, address: e.target.value || null })} sx={{ input: { color: "rgba(255,255,255,0.7)" }, "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.3)" } }} />
              ))}
              <TextField variant="standard" placeholder="Pincode" sx={{ width: "50%", input: { color: "rgba(255,255,255,0.7)" }, "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.3)" } }} />
            </Stack>
          </Stack>

          <Box sx={{ width: 200, height: 200, border: "1px dashed rgba(255,255,255,0.3)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", "&:hover": { borderColor: "white" } }}>
            <Typography color="rgba(255,255,255,0.5)">Upload Image</Typography>
          </Box>
        </Stack>
      </Stack>
    </DarkContainer>
  );

  const renderedContacts = contacts.data?.data ?? [];
  return (
    <DarkContainer title="Master Data">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <CustomButton onClick={openCreate}>New</CustomButton>
          <TextField 
            variant="outlined" 
            size="small"
            placeholder="Search" 
            value={search} 
            onChange={(event) => { setSearch(event.target.value); setPage(1); }} 
            sx={{ width: 300, input: { color: "white" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.3)" }, "&:hover fieldset": { borderColor: "white" } } }} 
          />
          <Stack direction="row" spacing={2} alignItems="center">
            <CustomButton onClick={() => setScreen("list")}>Back</CustomButton>
            <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, next) => next && setView(next)} sx={{ bgcolor: "white", borderRadius: 1 }}>
              <ToggleButton value="list"><ViewListIcon sx={{ color: "black" }} /></ToggleButton>
              <ToggleButton value="kanban"><ViewModuleIcon sx={{ color: "black" }} /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {contacts.isLoading ? <LoadingState label="Loading contacts..." /> : contacts.isError ? <ErrorState message={apiError(contacts.error)} onRetry={() => void contacts.refetch()} /> : renderedContacts.length === 0 ? <EmptyState message="No contacts found." /> : (
          view === "list" ? (
            <TableContainer sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>Select</TableCell>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>Image</TableCell>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>Name</TableCell>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>Email</TableCell>
                    <TableCell sx={{ color: "white", borderBottom: "none" }}>Phone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {renderedContacts.map((contact) => (
                    <TableRow key={contact.id} hover onClick={() => openRecord(contact)} sx={{ cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <TableCell sx={{ borderBottom: "none" }}><Checkbox size="small" sx={{ color: "rgba(255,255,255,0.5)" }} onClick={(e) => e.stopPropagation()} /></TableCell>
                      <TableCell sx={{ borderBottom: "none" }}><AccountCircleIcon sx={{ color: "rgba(255,255,255,0.3)" }} /></TableCell>
                      <TableCell sx={{ color: "white", borderBottom: "none" }}>{contact.name}</TableCell>
                      <TableCell sx={{ color: "white", borderBottom: "none" }}>{contact.email ?? "—"}</TableCell>
                      <TableCell sx={{ color: "white", borderBottom: "none" }}>{contact.phone ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 3, pt: 2 }}>
              {renderedContacts.map((contact) => (
                <Paper key={contact.id} variant="outlined" onClick={() => openRecord(contact)} sx={{ p: 2, cursor: "pointer", bgcolor: "transparent", borderColor: "rgba(255,255,255,0.3)", borderRadius: 3, "&:hover": { borderColor: "white" } }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 60, height: 60, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AccountCircleIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.3)" }} />
                    </Box>
                    <Stack>
                      <Typography color="white" fontWeight={600}>{contact.name}</Typography>
                      <Typography color="rgba(255,255,255,0.7)" variant="body2">{contact.email ?? "No email"}</Typography>
                      <Typography color="rgba(255,255,255,0.7)" variant="body2">{contact.phone ?? "No phone"}</Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Box>
          )
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="rgba(255,255,255,0.5)">{contacts.data?.meta.total ?? 0} records</Typography>
          <Pagination page={page} count={Math.max(1, contacts.data?.meta.totalPages ?? 1)} onChange={(_, value) => setPage(value)} sx={{ "& .MuiPaginationItem-root": { color: "white" } }} />
        </Box>
      </Stack>
    </DarkContainer>
  );
};
