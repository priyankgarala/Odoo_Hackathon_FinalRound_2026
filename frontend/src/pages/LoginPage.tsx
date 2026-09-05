import { useState, type FormEvent } from "react";
import axios from "axios";
import { Link, Navigate } from "react-router-dom";
import { Alert, Button, Stack, TextField, Typography, Box } from "@mui/material";
import { useAuth } from "../features/auth/AuthProvider";
import { AuthFrame } from "../components/auth/AuthFrame";

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
    "&.Mui-focused fieldset": { borderColor: "white" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "white" },
};

export const LoginPage = () => {
  const { user, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  if (user) return <Navigate to="/" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ email: identifier, password });
  };

  const message = axios.isAxiosError(login.error) 
    ? "Invalid Login Id or Password"
    : login.error 
      ? "Invalid Login Id or Password" 
      : undefined;

  return (
    <AuthFrame title="Login Page" subtitle="">
      <Stack spacing={3} component="form" onSubmit={submit} width="100%">
        {message && <Alert severity="error" sx={{ backgroundColor: 'rgba(211, 47, 47, 0.2)', color: '#ffb4ab', '& .MuiAlert-icon': { color: '#ffb4ab' } }}>{message}</Alert>}
        
        <TextField 
          label="Login Id -" 
          autoComplete="username" 
          value={identifier} 
          onChange={(event) => setIdentifier(event.target.value)} 
          required 
          fullWidth 
          autoFocus 
          sx={inputStyles}
        />
        
        <TextField 
          label="Password -" 
          type="password" 
          autoComplete="current-password" 
          value={password} 
          onChange={(event) => setPassword(event.target.value)} 
          required 
          fullWidth 
          sx={inputStyles}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button 
            type="submit" 
            variant="outlined" 
            size="large" 
            disabled={login.isPending}
            sx={{
              color: 'white',
              borderColor: 'white',
              borderRadius: 2,
              px: 4,
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {login.isPending ? "SIGNING IN..." : "SIGN IN"}
          </Button>
        </Box>
        
        <Typography variant="body2" align="center" sx={{ mt: 2, color: 'rgba(255,255,255,0.7)' }}>
          <Link to="#" style={{ color: 'white', textDecoration: 'none' }}>Forgot Password</Link>
          {' | '}
          <Link to="/signup" style={{ color: 'white', textDecoration: 'none' }}>Sign Up</Link>
        </Typography>
      </Stack>
    </AuthFrame>
  );
};
