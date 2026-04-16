import { Box, Typography, useTheme } from "@mui/material";
import { format, isSameMonth } from "date-fns";
import type { CalendarEvent } from "./types";
import { eventsForDay, isSameDay, monthGrid } from "./utils";

interface MonthViewProps {
  anchor: Date;
  events: CalendarEvent[];
  onSelectEvent?: (ev: CalendarEvent) => void;
  onSelectDay?: (d: Date) => void;
}

const MAX_EVENTS_PER_CELL = 3;

export function MonthView({ anchor, events, onSelectEvent, onSelectDay }: MonthViewProps) {
  const theme = useTheme();
  const days = monthGrid(anchor);
  const today = new Date();
  const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {weekLabels.map((w) => (
          <Typography
            key={w}
            variant="caption"
            sx={{
              textAlign: "center",
              py: 1,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: "text.secondary",
            }}
          >
            {w}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridAutoRows: "1fr",
        }}
      >
        {days.map((d) => {
          const inMonth = isSameMonth(d, anchor);
          const isToday = isSameDay(d, today);
          const dayEvents = eventsForDay(events, d);
          const extra = dayEvents.length - MAX_EVENTS_PER_CELL;
          return (
            <Box
              key={d.toISOString()}
              onClick={() => onSelectDay?.(d)}
              sx={{
                minHeight: 0,
                minWidth: 0,
                borderRight: `1px solid ${theme.palette.divider}`,
                borderTop: `1px solid ${theme.palette.divider}`,
                p: 0.6,
                display: "flex",
                flexDirection: "column",
                gap: 0.3,
                cursor: onSelectDay ? "pointer" : "default",
                bgcolor: !inMonth
                  ? theme.palette.action.hover
                  : "transparent",
                boxShadow: isToday
                  ? `inset 0 0 0 2px ${theme.palette.primary.main}`
                  : "none",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isToday ? 700 : 500,
                    color: !inMonth
                      ? "text.disabled"
                      : isToday
                        ? "primary.main"
                        : "text.primary",
                  }}
                >
                  {format(d, "d")}
                </Typography>
              </Box>
              {dayEvents.slice(0, MAX_EVENTS_PER_CELL).map((ev) => (
                <Box
                  key={ev.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent?.(ev);
                  }}
                  sx={{
                    bgcolor: ev.color,
                    color: "#fff",
                    borderRadius: 0.5,
                    px: 0.6,
                    py: 0.1,
                    fontSize: 11,
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    cursor: "pointer",
                    fontFamily: theme.typography.fontFamily,
                  }}
                  title={ev.title}
                >
                  <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                    {format(ev.start, "HH:mm")}
                  </Box>
                  {ev.title}
                </Box>
              ))}
              {extra > 0 && (
                <Typography variant="caption" sx={{ color: "primary.main", pl: 0.4 }}>
                  +{extra} more
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
