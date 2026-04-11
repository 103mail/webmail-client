import { useRef, useCallback } from "react";
import {
  Alert,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
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
  checkedIds: Set<string>;
  onToggleChecked: (threadId: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const LONG_PRESS_MS = 500;

export function MailList({ threads, onSelect, selectedId, searchQuery = "", onClearSearch, checkedIds, onToggleChecked }: MailListProps) {
  const q = searchQuery.toLowerCase();
  const filtered = q
    ? threads.filter((t) => t.subject.toLowerCase().includes(q))
    : threads;

  const selectionMode = checkedIds.size > 0;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  const handlePointerDown = useCallback((threadId: string) => {
    longPressedRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      onToggleChecked(threadId);
    }, LONG_PRESS_MS);
  }, [onToggleChecked]);

  const handlePointerUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = useCallback((thread: MailThread) => {
    if (longPressedRef.current) return;
    if (selectionMode) {
      onToggleChecked(thread.id);
    } else {
      onSelect(thread);
    }
  }, [selectionMode, onToggleChecked, onSelect]);

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
        const checked = checkedIds.has(thread.id);

        return (
          <ListItem key={thread.id} disablePadding divider>
            <ListItemButton
              selected={selectedId === thread.id}
              onClick={() => handleClick(thread)}
              onPointerDown={() => handlePointerDown(thread.id)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              sx={{ alignItems: "flex-start", py: 1.5, px: 3, userSelect: "none" }}
            >
              {selectionMode && (
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <Checkbox
                    edge="start"
                    checked={checked}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                  />
                </ListItemIcon>
              )}
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
