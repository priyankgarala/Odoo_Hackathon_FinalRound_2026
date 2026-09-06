import { useState, type FormEvent } from "react";
import axios from "axios";
import { Link, Navigate } from "react-router-dom";
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { useAuth } from "../features/auth/AuthProvider";
import { AuthFrame } from "../components/auth/AuthFrame";

const COLORS = {
  text: "#0f172a",
  muted: "#64748b",
  accent: "#2563eb",
  accentHover: "#1d4ed8",
  accentSoft: "#eff6ff",
  border: "#cbd5e1",
  borderHover: "#2563eb",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
};

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    color: COLORS.text,

    "& fieldset": {
      borderColor: COLORS.border,
    },

    "&:hover fieldset": {
      borderColor: COLORS.borderHover,
    },

    "&.Mui-focused fieldset": {
      borderColor: COLORS.accent,
    },
  },

  "& .MuiInputLabel-root": {
    color: COLORS.muted,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: COLORS.accent,
  },
};

export const LoginPage = () => {
  const { user, login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();

    login.mutate({
      email: identifier,
      password,
    });
  };

  const message = axios.isAxiosError(login.error)
    ? "Invalid Login Id or Password"
    : login.error
      ? "Invalid Login Id or Password"
      : undefined;

  return (
    <AuthFrame title="Login Page" subtitle="">
      <Stack
        spacing={2.2}
        component="form"
        onSubmit={submit}
        width="100%"
      >
        {/* Application Name */}
<Stack
  alignItems="center"
  spacing={0.3}
  sx={{ mb: 1 }}
>
  <Typography
    sx={{
      color: COLORS.text,
      fontSize: { xs: "1.5rem", sm: "1.65rem" },
      fontWeight: 700,
      letterSpacing: 0.3,
    }}
  >
    Urban Furniture
  </Typography>

  <Typography
    sx={{
      color: COLORS.muted,
      fontSize: "0.8rem",
    }}
  >
    Accounting System
  </Typography>
</Stack>

        {message && (
          <Alert
            severity="error"
            sx={{
              bgcolor: COLORS.dangerSoft,
              color: COLORS.danger,
              border: "1px solid rgba(233,139,139,0.18)",
              borderRadius: 2,
              py: 0.3,

              "& .MuiAlert-icon": {
                color: COLORS.danger,
              },
            }}
          >
            {message}
          </Alert>
        )}

        <TextField
          label="Login Id"
          autoComplete="username"
          value={identifier}
          onChange={(event) =>
            setIdentifier(event.target.value)
          }
          required
          fullWidth
          autoFocus
          sx={inputStyles}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
          fullWidth
          sx={inputStyles}
        />

        {/* Sign In */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            pt: 0.8,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={login.isPending}
            sx={{
              bgcolor: COLORS.accent,
              color: "#081311",
              borderRadius: 2,
              px: 4,
              py: 1,
              minWidth: 140,
              fontWeight: 700,

              "&:hover": {
                bgcolor: COLORS.accentHover,
              },

              "&.Mui-disabled": {
                bgcolor: "rgba(77,182,172,0.25)",
                color: "rgba(241,245,249,0.45)",
              },
            }}
          >
            {login.isPending ? "SIGNING IN..." : "SIGN IN"}
          </Button>
        </Box>

        {/* Links */}
        <Typography
          variant="body2"
          align="center"
          sx={{
            pt: 0.5,
            color: COLORS.muted,
            fontSize: "0.85rem",
          }}
        >
          <Link
            to="#"
            style={{
              color: COLORS.text,
              textDecoration: "none",
            }}
          >
            Forgot Password
          </Link>

          {" | "}

          <Link
            to="/signup"
            style={{
              color: COLORS.accent,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign Up
          </Link>
        </Typography>
      </Stack>
    </AuthFrame>
  );
};