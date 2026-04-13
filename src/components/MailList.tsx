import { useState, useRef, useCallback, useEffect } from "react";
import {
  Alert,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
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
  onFilteredChange?: (filtered: MailThread[]) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

type TimeRange = "1w" | "1m" | "1y" | "100y";

function getDateThreshold(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "1w": return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case "1m": return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "1y": return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case "100y": return new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
  }
}

const LONG_PRESS_MS = 500;

export function MailList({ threads, onSelect, selectedId, searchQuery = "", onClearSearch, checkedIds, onToggleChecked, onFilteredChange }: MailListProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1w");

  const q = searchQuery.toLowerCase();
  const threshold = getDateThreshold(timeRange);
  const filtered = threads
    .filter((t) => !q || t.subject.toLowerCase().includes(q))
    .filter((t) => new Date(t.messages[0].date) >= threshold);

  const filteredCount = filtered.length;
  const firstFilteredId = filtered[0]?.id ?? null;
  useEffect(() => {
    onFilteredChange?.(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCount, firstFilteredId, q]);

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
        severity="warning"
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
    <Box sx={{ display: "flex", justifyContent: "center", py: 1, px: 2 }}>
      <ToggleButtonGroup
        value={timeRange}
        exclusive
        onChange={(_e, val) => { if (val) setTimeRange(val); }}
        size="small"
        fullWidth
      >
        <ToggleButton value="1w">week</ToggleButton>
        <ToggleButton value="1m">month</ToggleButton>
        <ToggleButton value="1y">year</ToggleButton>
        <ToggleButton value="100y">ever</ToggleButton>
      </ToggleButtonGroup>
    </Box>
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
