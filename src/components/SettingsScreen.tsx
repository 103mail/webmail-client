import { useEffect, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Radio,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { useSession } from "../auth/AuthContext";
import type { ApiMailbox } from "../api/types";
import { MAILBOX_COLORS } from "../mailboxColors";

interface SettingsScreenProps {
  open: boolean;
  mailboxes: ApiMailbox[];
  onClose: () => void;
  /* Called after a save, so whatever shows mailboxes can read them again. */
  onSaved: () => void;
}

interface Draft {
  name: string;
  color: string;
}

// The listing names an unnamed mailbox after its address. That stand-in is not
// a name to edit, so the field starts empty with the address as placeholder.
function ownName(m: ApiMailbox): string {
  return m.name === m.senderEmail ? "" : m.name;
}

export function SettingsScreen({ open, mailboxes, onClose, onSaved }: SettingsScreenProps) {
  const theme = useTheme();
  const fullScreen = !useMediaQuery(theme.breakpoints.up("md"));
  const { api } = useSession();

  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [defaultId, setDefaultId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDrafts(Object.fromEntries(mailboxes.map((m) => [m.mailboxId, { name: ownName(m), color: m.color }])));
    setDefaultId(mailboxes.find((m) => m.isDefault)?.mailboxId ?? null);
    setError("");
  }, [open, mailboxes]);

  const edit = (id: number, change: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...change } }));

  // The server cannot clear a name (an empty one means "keep"), so a name is
  // only sent when there is one and it changed.
  const changes = mailboxes.flatMap((m) => {
    const d = drafts[m.mailboxId];
    if (!d) return [];
    const name = d.name.trim();
    const change: { name?: string; color?: string; isDefault?: boolean } = {};
    if (name && name !== ownName(m)) change.name = name;
    if (d.color !== m.color) change.color = d.color;
    if (m.mailboxId === defaultId && !m.isDefault) change.isDefault = true;
    return Object.keys(change).length > 0 ? [{ id: m.mailboxId, change }] : [];
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      for (const { id, change } of changes) await api.editMailbox(id, change);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saving failed.");
    } finally {
      setSaving(false);
    }
  };

  const canSave = changes.length > 0 && !saving;

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      {fullScreen ? (
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose} sx={{ mr: 1 }} aria-label="back">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Settings</Typography>
            <Button color="inherit" onClick={handleSave} disabled={!canSave}>Save</Button>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, pr: 2 }}>
          <Box sx={{ flexGrow: 1 }}>Settings</Box>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent>
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1, mb: 1, textTransform: "uppercase", letterSpacing: 0.6, color: "text.secondary" }}
        >
          Mailboxes
        </Typography>
        <Stack divider={<Divider flexItem />} spacing={2}>
          {mailboxes.map((m) => {
            const d = drafts[m.mailboxId];
            if (!d) return null;
            return (
              <Stack key={m.mailboxId} spacing={1.5}>
                <TextField
                  label="Name"
                  value={d.name}
                  placeholder={m.senderEmail}
                  onChange={(e) => edit(m.mailboxId, { name: e.target.value })}
                  helperText={m.senderEmail}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Colour
                  </Typography>
                  {Object.entries(MAILBOX_COLORS).map(([name, hex]) => (
                    <Tooltip key={name} title={name}>
                      <IconButton
                        size="small"
                        aria-label={name}
                        aria-pressed={d.color === name}
                        onClick={() => edit(m.mailboxId, { color: name })}
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: hex,
                          color: "#fff",
                          "&:hover": { bgcolor: hex, opacity: 0.85 },
                          outline: d.color === name ? `2px solid ${hex}` : "none",
                          outlineOffset: 2,
                        }}
                      >
                        {d.color === name && <CheckIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
                <FormControlLabel
                  control={
                    <Radio
                      checked={defaultId === m.mailboxId}
                      onChange={() => setDefaultId(m.mailboxId)}
                      size="small"
                    />
                  }
                  label="Default mailbox"
                />
              </Stack>
            );
          })}
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      {!fullScreen && (
        <DialogActions sx={{ px: 3, mt: -0.5, mb: 1.5 }}>
          <Button color="inherit" onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSave}>Save</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
