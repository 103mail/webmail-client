import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import type { Contact } from "../types";
import { useContacts } from "../api/hooks";

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
  // One address makes a direct chat, more make a group, which needs a name.
  onCreate: (participants: string[], name?: string) => Promise<void>;
}

export function NewChatDialog({ open, onClose, onCreate }: NewChatDialogProps) {
  const { data: contacts } = useContacts();
  const [to, setTo] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTo([]);
    setName("");
    setError("");
  }, [open]);

  const isGroup = to.length > 1;
  const canCreate = to.length > 0 && (!isGroup || name.trim() !== "") && !busy;

  const handleCreate = () => {
    if (!canCreate) return;
    setBusy(true);
    setError("");
    onCreate(to.map((c) => c.email), isGroup ? name.trim() : undefined)
      .then(onClose, (err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not start the chat."),
      )
      .finally(() => setBusy(false));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>New chat</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Autocomplete
          multiple
          freeSolo
          autoSelect
          options={contacts}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : `${option.name} <${option.email}>`
          }
          filterSelectedOptions
          value={to}
          onChange={(_e, value) =>
            setTo(value.map((v) => (typeof v === "string" ? { name: v, email: v } : v)))
          }
          isOptionEqualToValue={(option, value) =>
            typeof option === "string" || typeof value === "string"
              ? option === value
              : option.email === value.email
          }
          renderValue={(value, getItemProps) =>
            (value as Contact[]).map((contact, index) => {
              const { key, ...rest } = getItemProps({ index });
              return (
                <Chip
                  key={key}
                  label={contact.name === contact.email ? contact.email : contact.name}
                  {...rest}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField {...params} autoFocus label="To" placeholder="Name or email address" />
          )}
        />
        {isGroup && (
          <TextField
            label="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!canCreate}>
          {isGroup ? "Create group" : "Start chat"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
