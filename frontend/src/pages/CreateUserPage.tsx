import { useState, type FormEvent } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Stack, TextField, Typography, Box, RadioGroup, FormControlLabel, Radio, FormControl } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import * as authApi from "../api/auth.api";
import { useAuth } from "../features/auth/AuthProvider";
import { SYSTEM_ADMINISTRATOR, VIEWER } from "../features/auth/roles";

const roles = [SYSTEM_ADMINISTRATOR, VIEWER] as const;

const standardInputStyles = {
  "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.5)" },
  "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottomColor: "rgba(255,255,255,0.8)" },
  "& .MuiInput-underline:after": { borderBottomColor: "white" },
  "& .MuiInputBase-input": { color: "white", pb: 0.5 },
};

const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Stack direction="row" alignItems="center" spacing={2} sx={{ minHeight: 48 }}>
    <Typography sx={{ color: "white", minWidth: 160, fontWeight: 500 }}>
      {label}
    </Typography>
    <Box sx={{ flexGrow: 1 }}>
      {children}
    </Box>
  </Stack>
);

export const CreateUserPage = () => {
  const { user } = useAuth(); 
  const navigate = useNavigate();
  
  const [name, setName] = useState(""); 
  const [loginId, setLoginId] = useState(""); 
  const [email, setEmail] = useState(""); 
  const [roleName, setRoleName] = useState<(typeof roles)[number]>(VIEWER); 
  const [password, setPassword] = useState(""); 
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const create = useMutation({ mutationFn: authApi.createUser, onSuccess: () => navigate("/", { replace: true }) });
  
  if (user?.role !== SYSTEM_ADMINISTRATOR) return <Navigate to="/" replace />;
  
  const validatePassword = (pass: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{9,}$/.test(pass);
  };

  const submit = (event: FormEvent) => { 
    event.preventDefault(); 
    if (!validatePassword(password)) return;
    if (password === confirmPassword) {
      create.mutate({ name, loginId, email, password, roleName }); 
    }
  };
  
  const mismatch = Boolean(confirmPassword) && password !== confirmPassword;
  const invalidPassword = Boolean(password) && !validatePassword(password);
  
  let message = undefined;
  if (mismatch) message = "Passwords do not match.";
  else if (invalidPassword) message = "Password must be >8 chars, with lower, upper, and special character.";
  else if (axios.isAxiosError(create.error)) message = create.error.response?.data?.error ?? "Could not create the user.";
  else if (create.error) message = "Could not create the user.";

  return (
    <Stack spacing={3} alignItems="center" py={4}>
      <Box
        sx={{
          width: "100%",
          maxWidth: 600,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          bgcolor: "#121212",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Box
            sx={{
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 2,
              px: 4,
              py: 1.5,
              display: "inline-block",
            }}
          >
            <Typography fontWeight={700} letterSpacing={1} color="white" align="center">
              App Logo
            </Typography>
          </Box>
        </Box>

        <Stack component="form" spacing={2} onSubmit={submit}>
          {message && <Alert severity="error" sx={{ backgroundColor: 'rgba(211, 47, 47, 0.2)', color: '#ffb4ab', '& .MuiAlert-icon': { color: '#ffb4ab' } }}>{message}</Alert>}
          
          <FormRow label="Name">
            <TextField variant="standard" fullWidth value={name} onChange={(event) => setName(event.target.value)} required autoFocus sx={standardInputStyles} />
          </FormRow>
          
          <FormRow label="Login id">
            <TextField variant="standard" fullWidth value={loginId} onChange={(event) => setLoginId(event.target.value)} inputProps={{ minLength: 6, maxLength: 12 }} required sx={standardInputStyles} />
          </FormRow>
          
          <FormRow label="E-mail id">
            <TextField variant="standard" type="email" fullWidth value={email} onChange={(event) => setEmail(event.target.value)} required sx={standardInputStyles} />
          </FormRow>
          
          <FormRow label="Role">
            <FormControl>
              <RadioGroup 
                row 
                value={roleName} 
                onChange={(event) => setRoleName(event.target.value as (typeof roles)[number])}
              >
                <FormControlLabel value={VIEWER} control={<Radio sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: 'white' } }} />} label={<Typography color="white">Viewer</Typography>} sx={{ mr: 4 }} />
                <FormControlLabel value={SYSTEM_ADMINISTRATOR} control={<Radio sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: 'white' } }} />} label={<Typography color="white">System Administrator</Typography>} />
              </RadioGroup>
            </FormControl>
          </FormRow>

          <FormRow label="Password">
            <TextField variant="standard" type="password" fullWidth value={password} onChange={(event) => setPassword(event.target.value)} error={invalidPassword} required sx={standardInputStyles} />
          </FormRow>
          
          <FormRow label="Re-Enter Password">
            <TextField variant="standard" type="password" fullWidth error={mismatch} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required sx={standardInputStyles} />
          </FormRow>
          
          <Stack direction="row" spacing={3} mt={4}>
            <Button 
              type="submit" 
              variant="outlined" 
              disabled={create.isPending || mismatch || invalidPassword}
              sx={{ color: 'white', borderColor: 'white', borderRadius: 2, px: 4, minWidth: 120, '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
            >
              {create.isPending ? "..." : "Create"}
            </Button>
            <Button 
              onClick={() => navigate(-1)}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white', borderRadius: 2, px: 4, minWidth: 120, '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};
