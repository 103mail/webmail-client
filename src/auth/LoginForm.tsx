import { useState } from "react";
import { Box, Button, InputAdornment, TextField, Typography, Link } from "@mui/material";
import { useAuth } from "./AuthContext";
import { useDomain } from "../DomainContext";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export function LoginForm({ onSwitchToRegister, onSwitchToForgot }: LoginFormProps) {
  const { login } = useAuth();
  const { domain } = useDomain();
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // One hostname is one Domain, so the domain part is shown rather than typed
  // (federation design, section 2). An account whose login is an address on
  // another domain, which every migrated account is, can still be typed in
  // full; a value containing @ is taken as it stands.
  const address = handle.includes("@") ? handle : `${handle}@${domain}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(address, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
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
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        required
        autoFocus
        fullWidth
        slotProps={{
          input: {
            endAdornment: handle.includes("@") ? null : (
              <InputAdornment position="end">@{domain}</InputAdornment>
            ),
          },
        }}
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
      />

      <Button type="submit" variant="contained" fullWidth disabled={!handle || !password || busy}>
        {busy ? "Signing in…" : "Sign in"}
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
