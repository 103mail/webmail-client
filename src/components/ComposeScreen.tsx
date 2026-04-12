import { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Chip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import { FileAttachments } from "./FileAttachments";
import { sampleContacts } from "../data/contacts";
import type { Contact } from "../types";
import { loadComposeDraft, saveComposeDraft, clearComposeDraft } from "../drafts";

interface ComposeScreenProps {
  folderId: string;
  onDiscard: () => void;
}

export function ComposeScreen({ folderId, onDiscard }: ComposeScreenProps) {
  const draft = loadComposeDraft(folderId);
  const [to, setTo] = useState<Contact[]>(draft?.to ?? []);
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [attachments, setAttachments] = useState<File[]>([]);
  const discardedRef = useRef(false);

  const saveDraft = useCallback(() => {
    if (!discardedRef.current) {
      saveComposeDraft(folderId, { to, subject, body });
    }
  }, [folderId, to, subject, body]);

  useEffect(() => {
    return () => saveDraft();
  }, [saveDraft]);

  useEffect(() => {
    const d = loadComposeDraft(folderId);
    setTo(d?.to ?? []);
    setSubject(d?.subject ?? "");
    setBody(d?.body ?? "");
    setAttachments([]);
  }, [folderId]);

  const handleSend = () => {
    if (to.length === 0) return;
    console.log("Sending mail:", {
      to: to.map((c) => c.email),
      subject,
      body,
    });
    alert(`Mail sent to ${to.map((c) => c.name).join(", ")}!`);
    clearComposeDraft(folderId);
    setTo([]);
    setSubject("");
    setBody("");
  };

  const handleDiscard = () => {
    discardedRef.current = true;
    clearComposeDraft(folderId);
    onDiscard();
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
        <Autocomplete
          multiple
          freeSolo
          options={sampleContacts}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : `${option.name} <${option.email}>`
          }
          filterSelectedOptions
          value={to}
          onChange={(_e, value) => {
            setTo(
              value.map((v) =>
                typeof v === "string" ? { name: v, email: v } : v
              )
            );
          }}
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
                  size="small"
                  {...rest}
                />
              );
            })
          }
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <li key={key} {...rest}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label="To" placeholder="Add recipients…" />
          )}
        />

        <TextField
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          fullWidth
        />

        <TextField
          placeholder="Write your message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          fullWidth
          multiline
          minRows={5}
        />
        {/attach/i.test(body) && attachments.length === 0 && (
          <Alert severity="warning">
            It looks like you mentioned an attachment but haven't attached any files.
          </Alert>
        )}
        <FileAttachments files={attachments} onChange={setAttachments} />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={to.length === 0}
          >
            Send
          </Button>
          <Button
            variant="text"
            color="inherit"
            startIcon={<DeleteIcon />}
            onClick={handleDiscard}
          >
            Discard
          </Button>
        </Box>
    </Box>
  );
}
