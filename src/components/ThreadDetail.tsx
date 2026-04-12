import {
  Autocomplete,
  Box,
  Chip,
  Typography,
  Divider,
  Button,
  Paper,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import type { Attachment, Contact, MailThread } from "../types";

function attachmentIcon(type: string) {
  if (type === "application/pdf") return <PictureAsPdfIcon fontSize="small" />;
  if (type.includes("word") || type.includes("document")) return <DescriptionIcon fontSize="small" />;
  if (type.includes("sheet") || type.includes("excel")) return <DescriptionIcon fontSize="small" />;
  if (type.startsWith("image/")) return <InsertDriveFileIcon fontSize="small" />;
  return <AttachFileIcon fontSize="small" />;
}
import { useState, useEffect } from "react";
import { loadReplyDraft, saveReplyDraft, clearReplyDraft } from "../drafts";
import { sampleContacts } from "../data/contacts";

type PaneMode = "none" | "reply" | "forward";

interface ThreadDetailProps {
  thread: MailThread;
  replyRequested: number;
  forwardRequested: number;
  onPaneChange: (open: boolean) => void;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ThreadDetail({ thread, replyRequested, forwardRequested, onPaneChange }: ThreadDetailProps) {
  const draft = loadReplyDraft(thread.id);
  const [pane, setPane] = useState<PaneMode>(draft !== null ? "reply" : "none");
  const [replyText, setReplyText] = useState(draft?.text ?? "");
  const [forwardTo, setForwardTo] = useState<Contact[]>([]);

  // Open reply pane when FAB is pressed
  useEffect(() => {
    if (replyRequested > 0) setPane("reply");
  }, [replyRequested]);

  // Open forward pane when toolbar button is pressed
  useEffect(() => {
    if (forwardRequested > 0) setPane("forward");
  }, [forwardRequested]);

  // Notify parent of pane state
  useEffect(() => {
    onPaneChange(pane !== "none");
  }, [pane, onPaneChange]);

  // Autosave reply draft every 2 seconds
  useEffect(() => {
    if (pane !== "reply") return;
    const timer = setInterval(() => {
      saveReplyDraft(thread.id, { text: replyText });
    }, 2000);
    return () => clearInterval(timer);
  }, [pane, thread.id, replyText]);

  // Reset state when switching threads
  useEffect(() => {
    const d = loadReplyDraft(thread.id);
    setReplyText(d?.text ?? "");
    setPane(d !== null ? "reply" : "none");
    setForwardTo([]);
  }, [thread.id]);

  const handleDiscardReply = () => {
    setPane("none");
    setReplyText("");
    clearReplyDraft(thread.id);
  };

  const handleDiscardForward = () => {
    setPane("none");
    setForwardTo([]);
  };

  const newest = thread.messages[0];
  const replyRecipients = new Map<string, string>();
  replyRecipients.set(newest.from.email, newest.from.name);
  newest.to.forEach((c) => replyRecipients.set(c.email, c.name));

  return (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Subject */}
        <Typography variant="h6">{thread.subject}</Typography>

        {/* Reply pane */}
        {pane === "reply" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary">To:</Typography>
              {[...replyRecipients.entries()].map(([email, name]) => (
                <Chip key={email} label={name} size="small" />
              ))}
            </Box>
            <TextField
              placeholder="Write a reply…"
              multiline
              minRows={3}
              maxRows={8}
              fullWidth
              size="small"
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Button variant="contained" startIcon={<SendIcon />} disabled={replyText.trim().length === 0}>
                Send
              </Button>
              <Button variant="text" color="inherit" startIcon={<DeleteIcon />} onClick={handleDiscardReply}>
                Discard
              </Button>
            </Box>
          </Box>
        )}

        {/* Forward pane */}
        {pane === "forward" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary">To:</Typography>
              {[...replyRecipients.entries()].map(([email, name]) => (
                <Chip key={email} label={name} size="small" />
              ))}
            </Box>
            <Autocomplete
              multiple
              freeSolo
              options={sampleContacts}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : `${option.name} <${option.email}>`
              }
              filterSelectedOptions
              value={forwardTo}
              onChange={(_e, value) => {
                setForwardTo(
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
                <TextField {...params} label="Forward to" placeholder="Add recipients…" size="small" />
              )}
            />
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Button variant="contained" startIcon={<SendIcon />} disabled={forwardTo.length === 0}>
                Forward
              </Button>
              <Button variant="text" color="inherit" startIcon={<DeleteIcon />} onClick={handleDiscardForward}>
                Discard
              </Button>
            </Box>
          </Box>
        )}

        {/* Messages */}
        {thread.messages.map((msg) => (
          <Paper key={msg.id} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {msg.from.name}
                <Typography component="span" variant="body2" color="text.secondary">
                  {" "}&lt;{msg.from.email}&gt;
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 2 }}>
                {formatFullDate(msg.date)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              To: {msg.to.map((c) => c.name).join(", ")}
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {msg.body}
            </Typography>
            {msg.attachments && msg.attachments.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                {msg.attachments.map((att: Attachment) => (
                  <Chip
                    key={att.id}
                    icon={attachmentIcon(att.type)}
                    label={`${att.name} (${att.size})`}
                    variant="outlined"
                    clickable
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
