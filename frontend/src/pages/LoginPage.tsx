import { useState, type FormEvent } from "react";
import axios from "axios";
import { Navigate, useLocation } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "../features/auth/AuthProvider";
export const LoginPage = () => {
  const { user, login } = useAuth(); const location = useLocation(); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  if (user) return <Navigate to="/" replace />;
  const submit = (event: FormEvent) => { event.preventDefault(); login.mutate({ email, password }); };
  const message = axios.isAxiosError(login.error)
    ? (login.error.response?.data?.error ?? "The service is unavailable. Please try again.")
    : login.error ? "We could not sign you in. Please try again." : undefined;
  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default" }}><Card sx={{ width: "100%", maxWidth: 440 }}><CardContent sx={{ p: 4 }}><Stack spacing={3} component="form" onSubmit={submit}><Box><Typography variant="h4" fontWeight={800}>Welcome back</Typography><Typography color="text.secondary">Sign in to Urban Furniture Accounting.</Typography></Box>{message && <Alert severity="error">{message}</Alert>}<TextField label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth autoFocus /><TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required fullWidth /><Button type="submit" variant="contained" size="large" disabled={login.isPending}>{login.isPending ? "Signing in..." : "Sign in"}</Button><Typography variant="caption" color="text.secondary">Your session is stored only in an essential, secure HTTP-only cookie.</Typography></Stack></CardContent></Card></Box>;
};
