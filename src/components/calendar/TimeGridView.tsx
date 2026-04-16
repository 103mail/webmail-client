import { useMemo } from "react";
import { Box, Typography, alpha, useTheme } from "@mui/material";
import { format, getISOWeek, startOfDay } from "date-fns";
import type { CalendarEvent } from "./types";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  HOUR_HEIGHT,
  eventsForDay,
  isSameDay,
  layoutOverlaps,
  minutesFromStart,
} from "./utils";

interface TimeGridViewProps {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent?: (ev: CalendarEvent) => void;
}

const GUTTER_WIDTH = 56;
const BUSINESS_START = 9;
const BUSINESS_END = 17;

export function TimeGridView({ days, events, onSelectEvent }: TimeGridViewProps) {
  const theme = useTheme();
  const today = new Date();
  const todayStart = startOfDay(today).getTime();

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT;

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
      {/* Header row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `${GUTTER_WIDTH}px repeat(${days.length}, 1fr)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" sx={{ fontSize: 11, color: "text.secondary" }}>
            W{getISOWeek(days[0])}
          </Typography>
        </Box>
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <Box
              key={d.toISOString()}
              sx={{
                py: 1,
                px: 0.5,
                textAlign: "center",
                borderLeft: `1px solid ${theme.palette.divider}`,
                ...(isToday && {
                  borderBottom: `4px solid ${theme.palette.primary.main}`,
                }),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  color: isToday ? "primary.main" : "text.secondary",
                  fontWeight: 600,
                  display: "block",
                }}
              >
                {format(d, "EEE")}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: isToday ? "primary.main" : "text.primary",
                  lineHeight: 1.2,
                }}
              >
                {format(d, "d")}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* All-day section */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `${GUTTER_WIDTH}px repeat(${days.length}, 1fr)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: 28,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            pr: 0.75,
          }}
        >
          <Typography variant="caption" sx={{ fontSize: 11, color: "text.secondary" }}>
            all-day
          </Typography>
        </Box>
        {days.map((day) => {
          const allDayEvents = eventsForDay(events, day).filter((e) => e.allDay);
          return (
            <Box
              key={day.toISOString()}
              sx={{
                borderLeft: `1px solid ${theme.palette.divider}`,
                px: "2px",
                minWidth: 0,
                overflow: "hidden",
                py: 0.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
              }}
            >
              {allDayEvents.map((ev) => (
                <Box
                  key={ev.id}
                  onClick={() => onSelectEvent?.(ev)}
                  sx={{
                    bgcolor: ev.color,
                    color: "#fff",
                    borderRadius: 1,
                    px: 0.8,
                    py: 0.2,
                    cursor: "pointer",
                    "&:hover": { boxShadow: 2 },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                  >
                    {ev.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>

      {/* Scrollable body */}
      <Box sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `${GUTTER_WIDTH}px repeat(${days.length}, 1fr)`,
            position: "relative",
          }}
        >
          {/* Hour gutter */}
          <Box sx={{ position: "relative", height: gridHeight }}>
            {hours.map((h) => (
              <Box
                key={h}
                sx={{
                  position: "absolute",
                  top: (h - DAY_START_HOUR) * HOUR_HEIGHT - 7,
                  right: 6,
                }}
              >
                <Typography variant="caption" sx={{ fontSize: 11, color: "text.secondary" }}>
                  {h === 0 ? "" : format(new Date(2000, 0, 1, h), "HH:mm")}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = eventsForDay(events, day).filter((e) => !e.allDay);
            const overlaps = layoutOverlaps(dayEvents);
            const isToday = isSameDay(day, today);
            const isPast = startOfDay(day).getTime() < todayStart;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <Box
                key={day.toISOString()}
                sx={{
                  position: "relative",
                  height: gridHeight,
                  borderLeft: `1px solid ${theme.palette.divider}`,
                }}
              >
                {hours.map((h) => (
                  <Box
                    key={h}
                    sx={{
                      position: "absolute",
                      top: (h - DAY_START_HOUR) * HOUR_HEIGHT,
                      left: 0,
                      right: 0,
                      height: HOUR_HEIGHT,
                      borderTop: h === DAY_START_HOUR ? "none" : `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                      ...(isPast || isWeekend || (h < BUSINESS_START || h >= BUSINESS_END)) && {
                        bgcolor: alpha(theme.palette.text.primary, 0.03),
                      },
                    }}
                  />
                ))}

                {/* Half-hour lines */}
                {hours.map((h) => (
                  <Box
                    key={`half-${h}`}
                    sx={{
                      position: "absolute",
                      top: (h - DAY_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                      left: 0,
                      right: 0,
                      height: 0,
                      borderTop: `1px dashed ${alpha(theme.palette.divider, 0.12)}`,
                    }}
                  />
                ))}

                {/* Current-time indicator */}
                {isToday && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: ((minutesFromStart(today) - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT,
                      height: 2,
                      bgcolor: "error.main",
                      zIndex: 1,
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: -5,
                        top: -4,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "error.main",
                      },
                    }}
                  />
                )}

                {/* Events */}
                {dayEvents.map((ev) => {
                  const layout = overlaps.get(ev.id) ?? { col: 0, cols: 1 };
                  const startMin = Math.max(
                    minutesFromStart(ev.start),
                    DAY_START_HOUR * 60,
                  );
                  const endMin = Math.min(
                    minutesFromStart(ev.end),
                    DAY_END_HOUR * 60,
                  );
                  const top = ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const height = Math.max(18, ((endMin - startMin) / 60) * HOUR_HEIGHT - 2);
                  const widthPct = 100 / layout.cols;
                  const leftPct = layout.col * widthPct;
                  const isLastCol = layout.col === layout.cols - 1;
                  return (
                    <Box
                      key={ev.id}
                      onClick={() => onSelectEvent?.(ev)}
                      sx={{
                        position: "absolute",
                        top,
                        height,
                        left: `calc(${leftPct}% + 2px)`,
                        ...(isLastCol
                          ? { right: 2 }
                          : { width: `calc(${widthPct}% - 4px)` }),
                        bgcolor: ev.color,
                        color: "#fff",
                        borderRadius: 1,
                        boxShadow: 1,
                        px: 0.8,
                        py: 0.3,
                        overflow: "hidden",
                        cursor: "pointer",
                        zIndex: 2,
                        transition: theme.transitions.create(["box-shadow"]),
                        "&:hover": { boxShadow: 3 },
                        ...(isPast && {
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: "rgba(255, 255, 255, 0.6)",
                            borderRadius: 1,
                            pointerEvents: "none",
                          },
                        }),
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          display: "block",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {format(ev.start, "HH:mm")} {ev.title}
                      </Typography>
                      {ev.location && height > 36 && (
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.85,
                            display: "block",
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {ev.location}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
