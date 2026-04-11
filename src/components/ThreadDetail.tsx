import {
  Box,
  Typography,
  Divider,
  Button,
  Paper,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import ReplyAllIcon from "@mui/icons-material/ReplyAll";
import type { MailThread } from "../types";
import { useState, useEffect, useCallback } from "react";
import { loadReplyDraft, saveReplyDraft, clearReplyDraft } from "../drafts";

interface ThreadDetailProps {
  thread: MailThread;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ThreadDetail({ thread }: ThreadDetailProps) {
  const draft = loadReplyDraft(thread.id);
  const [replying, setReplying] = useState(draft !== null);
  const [replyText, setReplyText] = useState(draft?.text ?? "");

  // Save draft on unmount or thread change
  const saveDraft = useCallback(() => {
    saveReplyDraft(thread.id, { text: replyText });
  }, [thread.id, replyText]);

  useEffect(() => {
    return () => saveDraft();
  }, [saveDraft]);

  // Reset state when switching threads
  useEffect(() => {
    const d = loadReplyDraft(thread.id);
    setReplyText(d?.text ?? "");
    setReplying(d !== null);
  }, [thread.id]);

  const handleDiscard = () => {
    setReplying(false);
    setReplyText("");
    clearReplyDraft(thread.id);
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Reply pane */}
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {replying ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" startIcon={<SendIcon />} disabled={replyText.trim().length === 0}>
                Send
              </Button>
              <Button variant="text" color="inherit" startIcon={<DeleteIcon />} onClick={handleDiscard}>
                Discard
              </Button>
            </Box>
          </Box>
        ) : (
          <Button variant="outlined" startIcon={<ReplyAllIcon />} onClick={() => setReplying(true)}>
            Write Reply
          </Button>
        )}
      </Box>

      <Divider />

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: "auto", px: { xs: 2, sm: 3 }, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
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
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
