import { useState } from "react";
import { Box, Button, TextField, Typography, Link } from "@mui/material";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock: always succeed
    setSent(true);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Reset password</Typography>

      {sent ? (
        <>
          <Typography variant="body2" color="success.main">
            If an account exists for {email}, a reset link has been sent.
          </Typography>
          <Link component="button" variant="body2" type="button" onClick={onSwitchToLogin} underline="hover">
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            Enter your email and we'll send you a link to reset your password.
          </Typography>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            fullWidth
          />
          <Button type="submit" variant="contained" fullWidth disabled={!email}>
            Send reset link
          </Button>
          <Link component="button" variant="body2" type="button" onClick={onSwitchToLogin} underline="hover">
            Back to sign in
          </Link>
        </>
      )}
    </Box>
  );
}
