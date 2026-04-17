import { useCallback, useMemo, useRef, useState } from "react";
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
import { useTimeGridDrag } from "./useTimeGridDrag";

interface TimeGridViewProps {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent?: (ev: CalendarEvent) => void;
  onCreateEvent?: (start: Date, end: Date) => void;
  onCreateAllDay?: (startDay: Date, endDay: Date) => void;
}

const GUTTER_WIDTH = 56;
const BUSINESS_START = 9;
const BUSINESS_END = 17;

export function TimeGridView({ days, events, onSelectEvent, onCreateEvent, onCreateAllDay }: TimeGridViewProps) {
  const theme = useTheme();

  // All-day drag state
  const [allDayDrag, setAllDayDrag] = useState<{ startIdx: number; currentIdx: number } | null>(null);
  const allDayDragRef = useRef<{ startIdx: number; currentIdx: number } | null>(null);

  const handleAllDayMouseDown = useCallback((dayIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const state = { startIdx: dayIndex, currentIdx: dayIndex };
    allDayDragRef.current = state;
    setAllDayDrag(state);

    const onMove = (me: MouseEvent) => {
      const prev = allDayDragRef.current;
      if (!prev) return;
      // Find which day cell the mouse is over
      const target = document.elementFromPoint(me.clientX, me.clientY);
      if (!target) return;
      const cell = (target as HTMLElement).closest("[data-allday-idx]") as HTMLElement | null;
      if (!cell) return;
      const idx = Number(cell.dataset.alldayIdx);
      if (idx !== prev.currentIdx) {
        const next = { ...prev, currentIdx: idx };
        allDayDragRef.current = next;
        setAllDayDrag(next);
      }
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const final = allDayDragRef.current;
      if (final) {
        const startIdx = Math.min(final.startIdx, final.currentIdx);
        const endIdx = Math.max(final.startIdx, final.currentIdx);
        onCreateAllDay?.(days[startIdx], days[endIdx]);
      }
      allDayDragRef.current = null;
      setAllDayDrag(null);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [days, onCreateAllDay]);

  const { drag, scrollRef, setColRef, handleMouseDown } = useTimeGridDrag(
    days,
    (start, end) => onCreateEvent?.(start, end),
  );
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
                  boxShadow: `inset 0 -4px 0 0 ${theme.palette.primary.main}`,
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
        {days.map((day, dayIndex) => {
          const allDayEvents = eventsForDay(events, day).filter((e) => e.allDay);
          const adStart = allDayDrag ? Math.min(allDayDrag.startIdx, allDayDrag.currentIdx) : -1;
          const adEnd = allDayDrag ? Math.max(allDayDrag.startIdx, allDayDrag.currentIdx) : -1;
          const inDragRange = allDayDrag && dayIndex >= adStart && dayIndex <= adEnd;
          return (
            <Box
              key={day.toISOString()}
              data-allday-idx={dayIndex}
              onMouseDown={(e) => handleAllDayMouseDown(dayIndex, e)}
              sx={{
                borderLeft: `1px solid ${theme.palette.divider}`,
                px: "2px",
                minWidth: 0,
                overflow: "hidden",
                py: 0.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                cursor: "pointer",
                ...(inDragRange && { bgcolor: alpha(theme.palette.primary.main, 0.15) }),
                ...(allDayDrag && { userSelect: "none" }),
              }}
            >
              {allDayEvents.map((ev) => (
                <Box
                  key={ev.id}
                  onClick={(e) => { e.stopPropagation(); onSelectEvent?.(ev); }}
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
      <Box ref={scrollRef} sx={{ flexGrow: 1, overflow: "auto", minHeight: 0, ...(drag && { userSelect: "none" }) }}>
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
          {days.map((day, dayIndex) => {
            const dayEvents = eventsForDay(events, day).filter((e) => !e.allDay);
            const overlaps = layoutOverlaps(dayEvents);
            const isToday = isSameDay(day, today);
            const isPast = startOfDay(day).getTime() < todayStart;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const dragPreview = drag && drag.dayIndex === dayIndex;
            const rawStart = dragPreview ? Math.min(drag.startMinute, drag.currentMinute) : 0;
            const rawEnd = dragPreview ? Math.max(drag.startMinute, drag.currentMinute) : 0;
            const previewStartMin = rawStart;
            const previewEndMin = rawEnd - rawStart < 30 ? rawStart + 30 : rawEnd;
            const previewTop = ((previewStartMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
            const previewHeight = ((previewEndMin - previewStartMin) / 60) * HOUR_HEIGHT;
            return (
              <Box
                ref={setColRef(dayIndex)}
                key={day.toISOString()}
                onMouseDown={(e) => handleMouseDown(dayIndex, e)}
                sx={{
                  position: "relative",
                  height: gridHeight,
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  cursor: drag ? "row-resize" : "crosshair",
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
                {/* Drag preview */}
                {dragPreview && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: previewTop,
                      height: previewHeight,
                      left: 2,
                      right: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.25),
                      border: `2px dashed ${theme.palette.primary.main}`,
                      borderRadius: 1,
                      boxSizing: "border-box",
                      zIndex: 3,
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "flex-start",
                      px: 0.8,
                      py: 0.3,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "primary.main" }}>
                      {`${String(Math.floor(previewStartMin / 60)).padStart(2, "0")}:${String(previewStartMin % 60).padStart(2, "0")} – ${String(Math.floor(previewEndMin / 60)).padStart(2, "0")}:${String(previewEndMin % 60).padStart(2, "0")}`}
                    </Typography>
                  </Box>
                )}

                {dayEvents.map((ev) => {
                  const layout = overlaps.get(ev.id) ?? { col: 0, cols: 1 };
                  const evStartMin = isSameDay(ev.start, day)
                    ? minutesFromStart(ev.start)
                    : DAY_START_HOUR * 60;
                  const evEndMin = isSameDay(ev.end, day)
                    ? minutesFromStart(ev.end)
                    : DAY_END_HOUR * 60;
                  const startMin = Math.max(evStartMin, DAY_START_HOUR * 60);
                  const endMin = Math.min(evEndMin, DAY_END_HOUR * 60);
                  const top = ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const height = Math.max(18, ((endMin - startMin) / 60) * HOUR_HEIGHT - 4);
                  const widthPct = 100 / layout.cols;
                  const leftPct = layout.col * widthPct;
                  const isLastCol = layout.col === layout.cols - 1;
                  return (
                    <Box
                      key={ev.id}
                      onMouseDown={(e) => e.stopPropagation()}
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
