import { useMemo } from "react";
import { Box, Divider, List, ListItemButton, Typography, useTheme } from "@mui/material";
import { format, addDays, startOfDay } from "date-fns";
import type { CalendarEvent } from "./types";
import { isSameDay } from "./utils";

interface AgendaViewProps {
  anchor: Date;
  days?: number;
  events: CalendarEvent[];
  onSelectEvent?: (ev: CalendarEvent) => void;
}

export function AgendaView({ anchor, days = 14, events, onSelectEvent }: AgendaViewProps) {
  const theme = useTheme();
  const today = new Date();

  const grouped = useMemo(() => {
    const out: { day: Date; events: CalendarEvent[] }[] = [];
    const start = startOfDay(anchor);
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      const list = events
        .filter((e) => isSameDay(e.start, d))
        .sort((a, b) => a.start.getTime() - b.start.getTime());
      if (list.length > 0) out.push({ day: d, events: list });
    }
    return out;
  }, [anchor, events, days]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: 0,
        overflow: "auto",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      {grouped.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2">No events in the next {days} days.</Typography>
        </Box>
      ) : (
        grouped.map(({ day, events: list }) => {
          const isToday = isSameDay(day, today);
          return (
            <Box key={day.toISOString()}>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 1,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: isToday ? "primary.main" : "text.primary" }}
                >
                  {format(day, "EEEE, MMMM d")}
                </Typography>
                {isToday && (
                  <Typography variant="caption" sx={{ color: "primary.main" }}>
                    Today
                  </Typography>
                )}
              </Box>
              <List disablePadding>
                {list.map((ev) => (
                  <ListItemButton
                    key={ev.id}
                    onClick={() => onSelectEvent?.(ev)}
                    sx={{ alignItems: "flex-start", py: 1.2, gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 4,
                        alignSelf: "stretch",
                        borderRadius: 2,
                        bgcolor: ev.color,
                      }}
                    />
                    <Box sx={{ minWidth: 92 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {format(ev.start, "HH:mm")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(ev.end, "HH:mm")}
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {ev.title}
                      </Typography>
                      {ev.location && (
                        <Typography variant="caption" color="text.secondary" noWrap component="div">
                          {ev.location}
                        </Typography>
                      )}
                    </Box>
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </Box>
          );
        })
      )}
    </Box>
  );
}
