import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Divider,
  Drawer,
  Snackbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  format,
  addDays,
  addMonths,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from "date-fns";
import { useSession } from "../auth/AuthContext";
import { useAccounts, useCalendars, useMeetings } from "../api/hooks";
import type { MailAccount } from "../types";
import { AccountsPanel } from "./calendar/AccountsPanel";
import { AgendaView } from "./calendar/AgendaView";
import { EventEditDialog } from "./calendar/EventEditDialog";
import { MonthView } from "./calendar/MonthView";
import { TimeGridView } from "./calendar/TimeGridView";
import type { CalendarEvent, CalendarViewKind } from "./calendar/types";
import { rangeForView } from "./calendar/utils";

const ACCOUNTS_PANEL_WIDTH = 240;
const RAIL_WIDTH = 60;

export interface CalendarHeaderState {
  title: string;
  view: CalendarViewKind;
  availableViews: CalendarViewKind[];
  onView: (v: CalendarViewKind) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

interface CalendarViewProps {
  drawerOpen: boolean;
  onDrawerClose: () => void;
  layout: "mobile" | "medium" | "large";
  onHeaderChange?: (state: CalendarHeaderState) => void;
  onAccountClick?: () => void;
}

// A calendar is a mailbox (see calendar.ListCalendars), and its colour is the
// mailbox colour, which the API gives by name.
const COLORS: Record<string, string> = {
  red: "#d32f2f",
  blue: "#1976d2",
  green: "#2e7d32",
  orange: "#ed6c02",
  purple: "#7b1fa2",
  yellow: "#f9a825",
  grey: "#607d8b",
};
const FALLBACK_COLOR = "#607d8b";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarView({ drawerOpen, onDrawerClose, layout, onHeaderChange, onAccountClick }: CalendarViewProps) {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const { api } = useSession();
  const { data: mailboxData } = useAccounts();
  const { data: apiCalendars } = useCalendars();
  const [saveError, setSaveError] = useState("");

  const availableViews = useMemo<CalendarViewKind[]>(() => {
    if (!isMd) return ["day", "3day", "month", "agenda"];
    if (layout === "large") return ["week7", "month", "agenda"];
    return ["week5", "week7", "month", "agenda"];
  }, [isMd, layout]);

  const [view, setView] = useState<CalendarViewKind>(() =>
    isMd ? "week7" : "3day",
  );
  const [anchor, setAnchor] = useState<Date>(new Date());
  // The panel toggles calendars by label, so the label has to be unique. It is
  // the mailbox's sender address, falling back to the calendar's own name.
  const calendarsByLabel = useMemo(() => {
    const byId = new Map(mailboxData.mailboxes.map((m) => [m.mailboxId, m]));
    const seen = new Map<string, { id: number; color: string }>();
    for (const calendar of apiCalendars) {
      const mailbox = byId.get(calendar.mailboxId);
      let label = mailbox?.senderEmail || mailbox?.name || calendar.name;
      if (seen.has(label)) label = `${label} (${calendar.name})`;
      seen.set(label, {
        id: calendar.calendarId,
        color: COLORS[calendar.color] ?? FALLBACK_COLOR,
      });
    }
    return seen;
  }, [apiCalendars, mailboxData.mailboxes]);

  const accounts = useMemo<MailAccount[]>(
    () => [...calendarsByLabel.keys()].map((email) => ({ email, folders: [] })),
    [calendarsByLabel],
  );
  const accountColors = useMemo<Record<string, string>>(() => {
    const colors: Record<string, string> = {};
    for (const [label, calendar] of calendarsByLabel) colors[label] = calendar.color;
    return colors;
  }, [calendarsByLabel]);

  const [enabledAccounts, setEnabledAccounts] = useState<Set<string>>(() => new Set());
  // Calendars arrive after first render, and a calendar the user has not seen
  // yet starts enabled. Ones they switched off stay off.
  const known = useRef<Set<string>>(new Set());
  useEffect(() => {
    const fresh = [...calendarsByLabel.keys()].filter((label) => !known.current.has(label));
    if (fresh.length === 0) return;
    fresh.forEach((label) => known.current.add(label));
    setEnabledAccounts((prev) => new Set([...prev, ...fresh]));
  }, [calendarsByLabel]);
  const [editDialog, setEditDialog] = useState<{ start: Date; end: Date; title?: string; location?: string; description?: string; allDay?: boolean; accountEmail?: string; editId?: string } | null>(null);

  // If the view becomes unavailable on breakpoint change, fall back.
  const gridDayCounts: Record<string, number> = { day: 1, "3day": 3, week5: 5, week7: 7 };
  useEffect(() => {
    if (!availableViews.includes(view)) {
      const currentDays = gridDayCounts[view];
      if (currentDays) {
        const gridViews = availableViews.filter((v) => v in gridDayCounts);
        if (gridViews.length > 0) {
          // Sizing down: current has more days → pick most days available
          // Sizing up: current has fewer days → pick fewest days available
          const pick = currentDays > gridDayCounts[gridViews[0]]
            ? gridViews[gridViews.length - 1]
            : gridViews[0];
          setView(pick);
          return;
        }
      }
      setView(availableViews[0]);
    }
  }, [availableViews, view]);

  const enabledCalendarIds = useMemo(
    () =>
      [...calendarsByLabel.entries()]
        .filter(([label]) => enabledAccounts.has(label))
        .map(([, calendar]) => calendar.id),
    [calendarsByLabel, enabledAccounts],
  );

  // One request per visible window, widened by a week each side so stepping to
  // the next view does not blank the grid while it loads. untilDate is
  // exclusive.
  const [rangeFrom, rangeUntil] = useMemo(() => {
    const base =
      view === "month" ? startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }) : anchor;
    const span = view === "month" ? 42 : view === "agenda" ? 14 : 7;
    return [ymd(addDays(base, -7)), ymd(addDays(base, span + 7))];
  }, [view, anchor]);

  const { data: meetingsByDate, reload: reloadMeetings } = useMeetings(
    enabledCalendarIds,
    rangeFrom,
    rangeUntil,
  );

  // The server answers a map of day to meetings, so a meeting spanning days is
  // repeated under each. Keyed by id to collapse those back into one event.
  const events = useMemo<CalendarEvent[]>(() => {
    const labelById = new Map(
      [...calendarsByLabel.entries()].map(([label, calendar]) => [calendar.id, label]),
    );
    const byId = new Map<string, CalendarEvent>();
    for (const meetings of Object.values(meetingsByDate)) {
      for (const meeting of meetings) {
        const label = labelById.get(meeting.calendarId) ?? "";
        byId.set(String(meeting.meetingId), {
          id: String(meeting.meetingId),
          accountEmail: label,
          title: meeting.title,
          start: new Date(meeting.startTime),
          end: new Date(meeting.endTime),
          description: meeting.description || undefined,
          allDay: meeting.isAllDay || undefined,
          color: accountColors[label] ?? FALLBACK_COLOR,
        });
      }
    }
    return [...byId.values()];
  }, [meetingsByDate, calendarsByLabel, accountColors]);

  const handleCreateEvent = useCallback((start: Date, end: Date) => {
    setEditDialog({ start, end });
  }, []);

  const handleCreateAllDay = useCallback((startDay: Date, endDay: Date) => {
    const start = new Date(startDay);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDay);
    end.setHours(23, 59, 0, 0);
    setEditDialog({ start, end, allDay: true });
  }, []);

  const handleSelectEvent = useCallback((ev: CalendarEvent) => {
    setEditDialog({
      start: ev.start,
      end: ev.end,
      title: ev.title,
      location: ev.location,
      description: ev.description,
      allDay: ev.allDay,
      accountEmail: ev.accountEmail,
      editId: ev.id,
    });
  }, []);

  const handleSaveEvent = useCallback(
    (data: { title: string; start: Date; end: Date; location: string; description: string; allDay: boolean; accountEmail: string }) => {
      setSaveError("");
      // PUT /calendar/meeting/{id} only records an RSVP, so an existing meeting
      // cannot be rewritten from here. Deleting and creating again is what the
      // API supports, and that is the user's call to make rather than ours.
      if (editDialog?.editId) {
        setSaveError("Changing a meeting is not supported by the API yet. Delete it and create a new one.");
        return;
      }
      const calendar = calendarsByLabel.get(data.accountEmail);
      if (!calendar) {
        setSaveError("Pick a calendar to put this meeting in.");
        return;
      }
      void api
        .addMeeting(calendar.id, {
          title: data.title,
          startTime: data.start.toISOString(),
          endTime: data.end.toISOString(),
          // Stored in UTC with the display zone alongside it (ADR 8).
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          attendees: [],
          isAllDay: data.allDay,
          descriptionHtml: data.description,
        })
        .then(
          () => {
            setEditDialog(null);
            reloadMeetings();
          },
          (err: unknown) =>
            setSaveError(err instanceof Error ? err.message : "Could not create the meeting."),
        );
    },
    [api, editDialog?.editId, calendarsByLabel, reloadMeetings],
  );

  const handleDeleteEvent = useCallback(() => {
    const editId = editDialog?.editId;
    if (!editId) {
      setEditDialog(null);
      return;
    }
    void api.deleteMeeting(Number(editId)).then(
      () => {
        setEditDialog(null);
        reloadMeetings();
      },
      (err: unknown) =>
        setSaveError(err instanceof Error ? err.message : "Could not delete the meeting."),
    );
  }, [api, editDialog?.editId, reloadMeetings]);

  const toggleAccount = (email: string) => {
    setEnabledAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const gridDays =
    view === "day" || view === "3day" || view === "week5" || view === "week7"
      ? rangeForView(view, anchor)
      : [];

  const title = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const needsYear = !isMd ? ((d: Date) => d.getFullYear() !== currentYear) : () => true;
    const M = isMd ? "MMMM" : "MMM"; // full month on tablet/desktop, abbreviated on mobile
    const Ms = isMd ? "MMM" : "MMM"; // short month (always abbreviated for multi-month ranges)
    if (view === "month") {
      return format(anchor, `${M} yyyy`);
    }
    if (view === "agenda") {
      return format(anchor, needsYear(anchor) ? `${M} d, yyyy` : `${M} d`);
    }
    if (gridDays.length === 1) {
      return format(gridDays[0], needsYear(gridDays[0]) ? `${M} d, yyyy` : `${M} d`);
    }
    const first = gridDays[0];
    const last = gridDays[gridDays.length - 1];
    const showYear = needsYear(first) || needsYear(last);
    if (isSameMonth(first, last)) {
      return `${format(first, `${M} d`)}-${format(last, showYear ? "d, yyyy" : "d")}`;
    }
    return `${format(first, `${Ms} d`)}-${format(last, showYear ? `${Ms} d, yyyy` : `${Ms} d`)}`;
  }, [view, anchor, gridDays, isMd]);

  const step = view === "week5" || view === "week7" ? 7 : gridDays.length;
  const goPrev = useCallback(() => {
    if (view === "month") setAnchor((a) => addMonths(a, -1));
    else if (view === "agenda") setAnchor((a) => addDays(a, -14));
    else setAnchor((a) => addDays(a, -step));
  }, [view, step]);
  const goNext = useCallback(() => {
    if (view === "month") setAnchor((a) => addMonths(a, 1));
    else if (view === "agenda") setAnchor((a) => addDays(a, 14));
    else setAnchor((a) => addDays(a, step));
  }, [view, step]);
  const goToday = useCallback(() => setAnchor(new Date()), []);

  useEffect(() => {
    onHeaderChange?.({
      title,
      view,
      availableViews,
      onView: setView,
      onPrev: goPrev,
      onNext: goNext,
      onToday: goToday,
    });
  }, [onHeaderChange, title, view, availableViews, goPrev, goNext, goToday]);

  const openDay = (d: Date) => {
    setAnchor(d);
    setView(isMd ? "week7" : "day");
  };

  // The month view spans the month's weeks, so filter events to that range
  // to keep month-view rendering cheap.
  const monthEvents = useMemo(() => {
    if (view !== "month") return events;
    const first = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
    const last = endOfWeek(addDays(first, 41), { weekStartsOn: 1 });
    return events.filter((e) => e.end >= first && e.start <= last);
  }, [events, anchor, view]);

  const body = (() => {
    if (view === "month")
      return (
        <MonthView anchor={anchor} events={monthEvents} onSelectDay={openDay} onSelectEvent={handleSelectEvent} />
      );
    if (view === "agenda")
      return <AgendaView anchor={anchor} events={events} onSelectEvent={handleSelectEvent} />;
    return <TimeGridView days={gridDays} events={events} onCreateEvent={handleCreateEvent} onCreateAllDay={handleCreateAllDay} onSelectEvent={handleSelectEvent} />;
  })();

  const main = (
    <Box sx={{ flexGrow: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{body}</Box>
  );

  const accountsPanel = (
    <AccountsPanel
      accounts={accounts}
      colors={accountColors}
      enabled={enabledAccounts}
      onToggle={toggleAccount}
      showSettingsAccount={layout === "mobile"}
      onAccountClick={onAccountClick}
    />
  );

  const errorBar = saveError ? (
    <Snackbar
      open
      autoHideDuration={8000}
      onClose={() => setSaveError("")}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity="error" onClose={() => setSaveError("")}>{saveError}</Alert>
    </Snackbar>
  ) : null;

  const eventDialog = editDialog && (
    <EventEditDialog
      key={editDialog.editId ?? "new"}
      open
      initialStart={editDialog.start}
      initialEnd={editDialog.end}
      initialTitle={editDialog.title}
      initialLocation={editDialog.location}
      initialDescription={editDialog.description}
      initialAllDay={editDialog.allDay}
      initialAccountEmail={editDialog.accountEmail}
      accounts={accounts.map((a) => ({ email: a.email, color: accountColors[a.email] ?? "#607d8b" }))}
      onClose={() => setEditDialog(null)}
      onSave={handleSaveEvent}
      onDelete={editDialog.editId ? handleDeleteEvent : undefined}
    />
  );

  if (layout === "large") {
    return (
      <Box sx={{ display: "flex", flexGrow: 1, minHeight: 0 }}>
        <Box
          sx={{
            width: ACCOUNTS_PANEL_WIDTH,
            flexShrink: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            overflow: "auto",
            bgcolor: "background.paper",
          }}
        >
          {accountsPanel}
          <Divider />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>{main}</Box>
        {eventDialog}
        {errorBar}
      </Box>
    );
  }

  return (
    <>
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={onDrawerClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: ACCOUNTS_PANEL_WIDTH,
            mt: { xs: "56px", sm: "64px" },
            height: { xs: "calc(100% - 56px)", sm: "calc(100% - 64px)" },
            ...(layout === "medium" && { ml: `${RAIL_WIDTH}px` }),
          },
        }}
        slotProps={{ backdrop: { onClick: onDrawerClose } }}
      >
        {accountsPanel}
      </Drawer>
      {main}
      {eventDialog}
      {errorBar}
    </>
  );
}
