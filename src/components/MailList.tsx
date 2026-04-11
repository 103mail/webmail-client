import {
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { MailThread } from "../types";

interface MailListProps {
  threads: MailThread[];
  onSelect: (thread: MailThread) => void;
  selectedId: string | null;
  searchQuery?: string;
  onClearSearch?: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MailList({ threads, onSelect, selectedId, searchQuery = "", onClearSearch }: MailListProps) {
  const q = searchQuery.toLowerCase();
  const filtered = q
    ? threads.filter((t) => t.subject.toLowerCase().includes(q))
    : threads;

  return (
    <>
    {q && (
      <Alert
        severity="info"
        sx={{ borderRadius: 0 }}
        action={
          <IconButton size="small" color="inherit" onClick={onClearSearch} aria-label="clear filter">
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        Showing results for &lsquo;{searchQuery}&rsquo;
      </Alert>
    )}
    {filtered.length === 0 ? (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">No messages</Typography>
      </Box>
    ) : (
    <List disablePadding>
      {filtered.map((thread) => {
        const newest = thread.messages[0];
        const participants = [
          ...new Map(
            thread.messages.map((m) => [m.from.email, m.from.name])
          ).values(),
        ];
        const weight = thread.read ? 400 : 700;

        return (
          <ListItem key={thread.id} disablePadding divider>
            <ListItemButton
              selected={selectedId === thread.id}
              onClick={() => onSelect(thread)}
              sx={{ alignItems: "flex-start", py: 1.5, px: 3 }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: weight }}>
                        {participants.join(", ")}
                      </Typography>
                      {thread.messages.length > 1 && (
                        <Chip
                          label={thread.messages.length}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 12 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      {formatDate(newest.date)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    component="span"
                    sx={{ fontWeight: weight === 700 ? 600 : 400 }}
                  >
                    {thread.subject}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
    )}
    </>
  );
}
