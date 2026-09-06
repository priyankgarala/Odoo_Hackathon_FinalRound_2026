import { useState, type FormEvent } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import * as authApi from "../api/auth.api";
import { useAuth } from "../features/auth/AuthProvider";
import { SYSTEM_ADMINISTRATOR, VIEWER } from "../features/auth/roles";

const roles = [SYSTEM_ADMINISTRATOR, VIEWER] as const;

const COLORS = {
  page: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  muted: "#64748b",
  accent: "#2563eb",
  accentHover: "#1d4ed8",
  accentSoft: "#eff6ff",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
};

const standardInputStyles = {
  "& .MuiInput-underline:before": {
    borderBottomColor: COLORS.borderStrong,
  },
  "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
    borderBottomColor: COLORS.accent,
  },
  "& .MuiInput-underline:after": {
    borderBottomColor: COLORS.accent,
  },
  "& .MuiInputBase-input": {
    color: COLORS.text,
    pb: 0.4,
  },
};

const FormRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    alignItems={{ xs: "stretch", sm: "center" }}
    spacing={{ xs: 0.5, sm: 2 }}
    sx={{
      minHeight: { xs: "auto", sm: 46 },
      py: { xs: 0.5, sm: 0 },
    }}
  >
    <Typography
      sx={{
        color: COLORS.text,
        minWidth: { sm: 145 },
        fontWeight: 500,
        fontSize: "0.9rem",
      }}
    >
      {label}
    </Typography>

    <Box sx={{ flexGrow: 1 }}>{children}</Box>
  </Stack>
);

export const CreateUserPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [roleName, setRoleName] =
    useState<(typeof roles)[number]>(VIEWER);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const create = useMutation({
    mutationFn: authApi.createUser,
    onSuccess: () => navigate("/", { replace: true }),
  });

  if (user?.role !== SYSTEM_ADMINISTRATOR) {
    return <Navigate to="/" replace />;
  }

  const validatePassword = (pass: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{9,}$/.test(pass);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!validatePassword(password)) return;

    if (password === confirmPassword) {
      create.mutate({
        name,
        loginId,
        email,
        password,
        roleName,
      });
    }
  };

  const mismatch =
    Boolean(confirmPassword) && password !== confirmPassword;

  const invalidPassword =
    Boolean(password) && !validatePassword(password);

  let message = undefined;

  if (mismatch) {
    message = "Passwords do not match.";
  } else if (invalidPassword) {
    message =
      "Password must be >8 chars, with lower, upper, and special character.";
  } else if (axios.isAxiosError(create.error)) {
    message =
      create.error.response?.data?.error ??
      "Could not create the user.";
  } else if (create.error) {
    message = "Could not create the user.";
  }

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: COLORS.page,
        px: { xs: 2, sm: 3, md: 4 },
        pt: 0,
        pb: 3,
      }}
    >
      <Stack
        spacing={2}
        alignItems="center"
        sx={{
          width: "100%",
          pt: 0,
          mt: 0,
        }}
      >
        {/* Logo */}
        <Stack
          alignItems="center"
          spacing={0.5}
          sx={{
            mt: 0,
            pt: 0,
            mb: 0.5,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: COLORS.accentSoft,
              border: `1px solid ${COLORS.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 0 4px ${COLORS.accentSoft}`,
            }}
          >
            <Typography
              sx={{
                color: COLORS.accent,
                fontSize: "1.05rem",
                fontWeight: 800,
              }}
            >
              UF
            </Typography>
          </Box>

          <Typography
            sx={{
              color: COLORS.text,
              fontSize: "1.3rem",
              fontWeight: 700,
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

        {/* Create User Card */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 720,
            p: { xs: 2, sm: 3, md: 3.5 },
            borderRadius: 3,
            bgcolor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
          }}
        >
          <Stack spacing={2.5}>
            {/* Heading */}
            <Box>
              <Typography
                sx={{
                  color: COLORS.text,
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  mb: 0.3,
                }}
              >
                Create User
              </Typography>

              <Typography
                sx={{
                  color: COLORS.muted,
                  fontSize: "0.82rem",
                }}
              >
                Add a new user to the Urban Furniture accounting system.
              </Typography>
            </Box>

            <Stack
              component="form"
              spacing={1.2}
              onSubmit={submit}
            >
              {message && (
                <Alert
                  severity="error"
                  sx={{
                    bgcolor: COLORS.dangerSoft,
                    color: COLORS.danger,
                    border: "1px solid rgba(233,139,139,0.18)",
                    borderRadius: 2,
                    py: 0.2,
                    "& .MuiAlert-icon": {
                      color: COLORS.danger,
                    },
                  }}
                >
                  {message}
                </Alert>
              )}

              <FormRow label="Name">
                <TextField
                  variant="standard"
                  fullWidth
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  autoFocus
                  sx={standardInputStyles}
                />
              </FormRow>

              <FormRow label="Login ID">
                <TextField
                  variant="standard"
                  fullWidth
                  value={loginId}
                  onChange={(event) =>
                    setLoginId(event.target.value)
                  }
                  inputProps={{
                    minLength: 6,
                    maxLength: 12,
                  }}
                  required
                  sx={standardInputStyles}
                />
              </FormRow>

              <FormRow label="E-mail ID">
                <TextField
                  variant="standard"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  sx={standardInputStyles}
                />
              </FormRow>

              <FormRow label="Role">
                <FormControl>
                  <RadioGroup
                    row
                    value={roleName}
                    onChange={(event) =>
                      setRoleName(
                        event.target.value as (typeof roles)[number]
                      )
                    }
                  >
                    <FormControlLabel
                      value={VIEWER}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: COLORS.muted,
                            "&.Mui-checked": {
                              color: COLORS.accent,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          color={COLORS.text}
                          fontSize="0.85rem"
                        >
                          Viewer
                        </Typography>
                      }
                      sx={{ mr: 3 }}
                    />

                    <FormControlLabel
                      value={SYSTEM_ADMINISTRATOR}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: COLORS.muted,
                            "&.Mui-checked": {
                              color: COLORS.accent,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          color={COLORS.text}
                          fontSize="0.85rem"
                        >
                          System Administrator
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </FormRow>

              <FormRow label="Password">
                <TextField
                  variant="standard"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  error={invalidPassword}
                  required
                  sx={standardInputStyles}
                />
              </FormRow>

              <FormRow label="Re-Enter Password">
                <TextField
                  variant="standard"
                  type="password"
                  fullWidth
                  error={mismatch}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  sx={standardInputStyles}
                />
              </FormRow>

              {/* Actions */}
              <Stack
                direction="row"
                spacing={2}
                sx={{ pt: 1.5 }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    create.isPending ||
                    mismatch ||
                    invalidPassword
                  }
                  sx={{
                    bgcolor: COLORS.accent,
                    color: "#081311",
                    borderRadius: 2,
                    px: 3,
                    py: 0.8,
                    minWidth: 110,
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
                  {create.isPending ? "..." : "Create"}
                </Button>

                <Button
                  onClick={() => navigate(-1)}
                  variant="outlined"
                  sx={{
                    color: COLORS.text,
                    borderColor: COLORS.borderStrong,
                    borderRadius: 2,
                    px: 3,
                    py: 0.8,
                    minWidth: 110,
                    "&:hover": {
                      borderColor: COLORS.accent,
                      bgcolor: COLORS.accentSoft,
                    },
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};