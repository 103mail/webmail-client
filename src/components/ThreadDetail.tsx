import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  Typography,
  Divider,
  Button,
  Paper,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import { FileAttachments } from "./FileAttachments";
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
import { useSession } from "../auth/AuthContext";
import { useContacts } from "../api/hooks";
import { toUploads, toBlobUrl } from "../api/adapt";

type PaneMode = "none" | "reply" | "forward";

interface ThreadDetailProps {
  thread: MailThread;
  replyRequested: number;
  forwardRequested: number;
  onPaneChange: (open: boolean) => void;
  onSent: () => void;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ThreadDetail({ thread, replyRequested, forwardRequested, onPaneChange, onSent }: ThreadDetailProps) {
  const { api } = useSession();
  const { data: sampleContacts } = useContacts();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const draft = loadReplyDraft(thread.id);
  const [pane, setPane] = useState<PaneMode>(draft !== null ? "reply" : "none");
  const [replyText, setReplyText] = useState(draft?.text ?? "");
  const [forwardTo, setForwardTo] = useState<Contact[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [showAttachments, setShowAttachments] = useState(false);

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
    setReplyAttachments([]);
    setShowAttachments(false);
    setPane(d !== null ? "reply" : "none");
    setForwardTo([]);
  }, [thread.id]);

  // A reply is a new message on the same thread. It reaches every subscriber
  // through their own projection; nothing is forwarded anywhere (ADR 4).
  const handleSendReply = async () => {
    setSending(true);
    setSendError("");
    try {
      await api.addMessage(Number(thread.id), replyText, await toUploads(replyAttachments));
      clearReplyDraft(thread.id);
      setReplyText("");
      setReplyAttachments([]);
      setPane("none");
      onSent();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not send the reply.");
    } finally {
      setSending(false);
    }
  };

  // Adding someone to a thread is a subscription, not a forward: they see the
  // thread from now on and the history stays where it is.
  const handleAddSubscribers = async () => {
    setSending(true);
    setSendError("");
    try {
      for (const contact of forwardTo) {
        await api.addSubscriber(Number(thread.id), contact.email);
      }
      setForwardTo([]);
      setPane("none");
      onSent();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not add the recipients.");
    } finally {
      setSending(false);
    }
  };

  // Attachment bytes come back base64 in JSON rather than from a URL, so the
  // download is assembled here.
  const handleOpenAttachment = async (id: string, name: string) => {
    const file = await api.attachment(Number(id));
    const url = toBlobUrl(file.fileData, file.mimeType);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDiscardReply = () => {
    setPane("none");
    setReplyText("");
    setReplyAttachments([]);
    setShowAttachments(false);
    clearReplyDraft(thread.id);
  };

  const handleDiscardForward = () => {
    setPane("none");
    setForwardTo([]);
  };

  // Everyone already on the thread. Taken from the subscribers the listing
  // reported when the messages have not been fetched yet.
  const newest = thread.messages[0];
  const replyRecipients = new Map<string, string>();
  if (thread.messagesLoaded && newest) {
    replyRecipients.set(newest.from.email, newest.from.name);
    newest.to.forEach((c) => replyRecipients.set(c.email, c.name));
  } else {
    thread.participants?.forEach((c) => replyRecipients.set(c.email, c.name));
  }

  return (
    <Box sx={{ height: "100%", overflow: "auto", bgcolor: "grey.100" }}>
      <Box sx={{ px: { xs: 1, sm: 1.5 }, py: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Subject */}
        <Paper variant="outlined" sx={{ px: 2, py: 1, mt: 0.5 }}>
          <Typography variant="h6">{thread.subject}</Typography>
        </Paper>

        {/* Reply pane */}
        {pane === "reply" && (
          <Paper variant="outlined" sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {sendError && <Alert severity="error">{sendError}</Alert>}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary">To:</Typography>
              {[...replyRecipients.entries()].map(([email, name]) => (
                <Chip key={email} label={name} />
              ))}
            </Box>
            <TextField
              placeholder="Write a reply…"
              multiline
              minRows={5}
              fullWidth
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              sx={{ "& .MuiInputBase-root": { bgcolor: "background.paper" } }}
            />
            {/attach/i.test(replyText) && replyAttachments.length === 0 && (
              <Alert severity="warning">
                It looks like you mentioned an attachment but haven't attached any files.
              </Alert>
            )}
            {(showAttachments || replyAttachments.length > 0) && (
              <FileAttachments files={replyAttachments} onChange={(files) => { setReplyAttachments(files); if (files.length === 0) setShowAttachments(false); }} />
            )}
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                disabled={replyText.trim().length === 0 || sending}
                onClick={() => void handleSendReply()}
              >
                {sending ? "Sending…" : "Send"}
              </Button>
              <Button variant="text" color="inherit" startIcon={<DeleteIcon />} onClick={handleDiscardReply}>
                Discard
              </Button>
              {!showAttachments && replyAttachments.length === 0 && (
                <>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="text"
                    startIcon={<AttachFileIcon fontSize="small" />}
                    onClick={() => setShowAttachments(true)}
                    color="inherit"
                  >
                    Attach
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        )}

        {/* Forward pane */}
        {pane === "forward" && (
          <Paper variant="outlined" sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {sendError && <Alert severity="error">{sendError}</Alert>}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary">To:</Typography>
              {[...replyRecipients.entries()].map(([email, name]) => (
                <Chip key={email} label={name} />
              ))}
            </Box>
            <Autocomplete
              multiple
              freeSolo
              autoSelect
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
                <TextField {...params} label="Forward to" placeholder="Add recipients…" />
              )}
            />
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                disabled={forwardTo.length === 0 || sending}
                onClick={() => void handleAddSubscribers()}
              >
                {sending ? "Adding…" : "Add to thread"}
              </Button>
              <Button variant="text" color="inherit" startIcon={<CloseIcon />} onClick={handleDiscardForward}>
                Cancel
              </Button>
            </Box>
          </Paper>
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
                    onClick={() => void handleOpenAttachment(att.id, att.name)}
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
