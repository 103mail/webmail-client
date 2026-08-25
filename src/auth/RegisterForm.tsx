import { useState } from "react";
import { Box, Button, TextField, Typography, Link } from "@mui/material";
import { useAuth } from "./AuthContext";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const passwordsMatch = password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Create account</Typography>

      {error && (
        <Typography variant="body2" color="error">{error}</Typography>
      )}

      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
        fullWidth
      />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
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
      <TextField
        label="Confirm password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        fullWidth
        error={confirm.length > 0 && !passwordsMatch}
        helperText={confirm.length > 0 && !passwordsMatch ? "Passwords do not match" : ""}
      />

      <Button type="submit" variant="contained" fullWidth disabled={!name || !email || !password || !confirm}>
        Create account
      </Button>

      <Link component="button" variant="body2" type="button" onClick={onSwitchToLogin} underline="hover">
        Already have an account? Sign in
      </Link>
    </Box>
  );
}
