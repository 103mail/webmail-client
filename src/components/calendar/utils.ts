import { addDays, startOfDay, startOfMonth, startOfWeek, endOfMonth, endOfWeek } from "date-fns";
import { darken, lighten } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import type { CalendarEvent } from "./types";

// An event is a light tint of its mailbox colour with dark text and a stripe
// of the full colour, so the colour tells mailboxes apart without a block of
// strong red or blue. The tint is opaque so overlapping events stay legible.
export function eventColors(color: string, theme: Theme) {
  const dark = theme.palette.mode === "dark";
  return {
    bgcolor: dark ? darken(color, 0.6) : lighten(color, 0.85),
    color: dark ? lighten(color, 0.7) : darken(color, 0.5),
    borderLeft: `3px solid ${color}`,
  };
}

export const HOUR_HEIGHT = 80;
export const DAY_START_HOUR = 0;
export const DAY_END_HOUR = 24;

export function rangeForView(
  kind: "day" | "3day" | "week5" | "week7",
  anchor: Date,
): Date[] {
  const base = startOfDay(anchor);
  if (kind === "day") return [base];
  if (kind === "3day") return [0, 1, 2].map((d) => addDays(base, d));
  if (kind === "week5") {
    const monday = startOfWeek(anchor, { weekStartsOn: 1 });
    return [0, 1, 2, 3, 4].map((d) => addDays(monday, d));
  }
  // week7
  const monday = startOfWeek(anchor, { weekStartsOn: 1 });
  return [0, 1, 2, 3, 4, 5, 6].map((d) => addDays(monday, d));
}

export function monthGrid(anchor: Date): Date[] {
  const first = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cur = first;
  while (cur <= last) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

export function minutesFromStart(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + 86_400_000;
  return events
    .filter((e) => e.end.getTime() > dayStart && e.start.getTime() < dayEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Assign each event a column index within a set of overlapping events so
 * they can be rendered side-by-side without overlapping visually.
 * Returns a map from event id → { col, cols } where cols is the total
 * number of columns in the overlap cluster the event belongs to.
 */
export function layoutOverlaps(
  events: CalendarEvent[],
): Map<string, { col: number; cols: number }> {
  const result = new Map<string, { col: number; cols: number }>();
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  let cluster: CalendarEvent[] = [];
  let clusterEnd = 0;

  const flush = () => {
    if (cluster.length === 0) return;
    const columns: CalendarEvent[][] = [];
    for (const ev of cluster) {
      let placed = false;
      for (const col of columns) {
        if (col[col.length - 1].end <= ev.start) {
          col.push(ev);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([ev]);
    }
    const cols = columns.length;
    columns.forEach((col, idx) => {
      col.forEach((ev) => result.set(ev.id, { col: idx, cols }));
    });
    cluster = [];
    clusterEnd = 0;
  };

  for (const ev of sorted) {
    if (cluster.length === 0 || ev.start.getTime() < clusterEnd) {
      cluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.end.getTime());
    } else {
      flush();
      cluster.push(ev);
      clusterEnd = ev.end.getTime();
    }
  }
  flush();
  return result;
}
