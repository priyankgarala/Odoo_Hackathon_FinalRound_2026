import { useState, type FormEvent } from "react";
import axios from "axios";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Stack, TextField, Typography, Box } from "@mui/material";
import { useAuth } from "../features/auth/AuthProvider";
import { AuthFrame } from "../components/auth/AuthFrame";

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    color: "#0f172a",
    bgcolor: "#ffffff",
    "& fieldset": { borderColor: "#cbd5e1" },
    "&:hover fieldset": { borderColor: "#94a3b8" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb" },
  },
  "& .MuiInputLabel-root": { color: "#64748b" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#2563eb" },
  "& .MuiFormHelperText-root": { color: "#64748b" },
};

export const SignupPage = () => {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (user) return <Navigate to="/" replace />;

  const validatePassword = (pass: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{9,}$/.test(pass);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validatePassword(password)) {
      return;
    }
    if (password === confirmPassword) {
      signup.mutate({ name: loginId, loginId, email, password }, { onSuccess: () => navigate("/", { replace: true }) });
    }
  };

  const mismatch = Boolean(confirmPassword) && password !== confirmPassword;
  const invalidPassword = Boolean(password) && !validatePassword(password);
  
  let message = undefined;
  if (mismatch) message = "Passwords do not match.";
  else if (invalidPassword) message = "Password must be >8 chars, with lower, upper, and special character.";
  else if (axios.isAxiosError(signup.error)) message = signup.error.response?.data?.error ?? "Sign up is unavailable.";
  else if (signup.error) message = "We could not create your account.";

  return (
    <AuthFrame title="Sign Up Page" subtitle="">
      <Stack spacing={3} component="form" onSubmit={submit} width="100%">
        {message && <Alert severity="error" sx={{ backgroundColor: 'rgba(211, 47, 47, 0.2)', color: '#ffb4ab', '& .MuiAlert-icon': { color: '#ffb4ab' } }}>{message}</Alert>}
        
        <TextField 
          label="Enter Login Id -" 
          value={loginId} 
          onChange={(event) => setLoginId(event.target.value)} 
          inputProps={{ minLength: 6, maxLength: 12 }} 
          required 
          fullWidth
          sx={inputStyles}
        />
        
        <TextField 
          label="Enter Email Id -" 
          type="email" 
          autoComplete="email" 
          value={email} 
          onChange={(event) => setEmail(event.target.value)} 
          required 
          fullWidth
          sx={inputStyles}
        />
        
        <TextField 
          label="Enter Password -" 
          type="password" 
          value={password} 
          onChange={(event) => setPassword(event.target.value)} 
          error={invalidPassword}
          required 
          fullWidth
          sx={inputStyles}
        />
        
        <TextField 
          label="Re-Enter Password -" 
          type="password" 
          value={confirmPassword} 
          onChange={(event) => setConfirmPassword(event.target.value)} 
          error={mismatch} 
          required 
          fullWidth
          sx={inputStyles}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button 
            type="submit" 
            variant="outlined" 
            size="large" 
            disabled={signup.isPending || mismatch || invalidPassword}
            sx={{
              color: 'black',
              borderColor: 'black',
              borderRadius: 2,
              px: 4,
              '&:hover': {
                borderColor: 'black',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {signup.isPending ? "SIGNING IN..." : "SIGN UP"}
          </Button>
        </Box>
        
        <Typography variant="body2" align="center" sx={{ mt: 2, color: 'rgba(255,255,255,0.7)' }}>
          <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Already have an account? Login</Link>
        </Typography>
      </Stack>
    </AuthFrame>
  );
};
