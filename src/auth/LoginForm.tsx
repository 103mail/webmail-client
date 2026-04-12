import { useState } from "react";
import { Box, Button, TextField, Typography, Link } from "@mui/material";
import { useAuth } from "./AuthContext";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export function LoginForm({ onSwitchToRegister, onSwitchToForgot }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Sign in</Typography>

      {error && (
        <Typography variant="body2" color="error">{error}</Typography>
      )}

      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
      />

      <Button type="submit" variant="contained" fullWidth disabled={!email || !password}>
        Sign in
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Link component="button" variant="body2" type="button" onClick={onSwitchToForgot} underline="hover">
          Forgot password?
        </Link>
        <Link component="button" variant="body2" type="button" onClick={onSwitchToRegister} underline="hover">
          Create account
        </Link>
      </Box>
    </Box>
  );
}
