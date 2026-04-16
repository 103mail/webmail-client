import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Divider,
  Drawer,
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
import { accounts } from "../data/accounts";
import { appointments, accountColors } from "../data/appointments";
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
}

export function CalendarView({ drawerOpen, onDrawerClose, layout, onHeaderChange }: CalendarViewProps) {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));

  const availableViews = useMemo<CalendarViewKind[]>(() => {
    if (!isMd) return ["day", "3day", "month", "agenda"];
    if (layout === "large") return ["week7", "month", "agenda"];
    return ["week5", "week7", "month", "agenda"];
  }, [isMd, layout]);

  const [view, setView] = useState<CalendarViewKind>(() =>
    isMd ? "week7" : "3day",
  );
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [enabledAccounts, setEnabledAccounts] = useState<Set<string>>(
    () => new Set(accounts.map((a) => a.email)),
  );
  const [editDialog, setEditDialog] = useState<{ start: Date; end: Date } | null>(null);
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);

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

  const events = useMemo<CalendarEvent[]>(
    () => [
      ...appointments
        .filter((a) => enabledAccounts.has(a.accountEmail))
        .map((a) => ({
          id: a.id,
          accountEmail: a.accountEmail,
          title: a.title,
          start: new Date(a.start),
          end: new Date(a.end),
          location: a.location,
          description: a.description,
          allDay: a.allDay,
          color: accountColors[a.accountEmail] ?? "#607d8b",
        })),
      ...localEvents,
    ],
    [enabledAccounts, localEvents],
  );

  const handleCreateEvent = useCallback((start: Date, end: Date) => {
    setEditDialog({ start, end });
  }, []);

  const handleSaveEvent = useCallback((data: { title: string; start: Date; end: Date; location: string; description: string }) => {
    const defaultAccount = accounts[0]?.email ?? "";
    const newEvent: CalendarEvent = {
      id: `local-${Date.now()}`,
      accountEmail: defaultAccount,
      title: data.title,
      start: data.start,
      end: data.end,
      location: data.location || undefined,
      description: data.description || undefined,
      color: accountColors[defaultAccount] ?? "#607d8b",
    };
    setLocalEvents((prev) => [...prev, newEvent]);
  }, []);

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
    if (view === "month") {
      return format(anchor, "MMMM yyyy");
    }
    if (view === "agenda") {
      return `${format(anchor, "MMM d, yyyy")}`;
    }
    if (gridDays.length === 1) {
      return format(gridDays[0], "MMMM d, yyyy");
    }
    const first = gridDays[0];
    const last = gridDays[gridDays.length - 1];
    if (isSameMonth(first, last)) {
      return `${format(first, "MMMM d")}-${format(last, "d, yyyy")}`;
    }
    return `${format(first, "MMM d")}-${format(last, "MMM d, yyyy")}`;
  }, [view, anchor, gridDays]);

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
        <MonthView anchor={anchor} events={monthEvents} onSelectDay={openDay} />
      );
    if (view === "agenda")
      return <AgendaView anchor={anchor} events={events} />;
    return <TimeGridView days={gridDays} events={events} onCreateEvent={handleCreateEvent} />;
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
    />
  );

  const eventDialog = editDialog && (
    <EventEditDialog
      open
      initialStart={editDialog.start}
      initialEnd={editDialog.end}
      onClose={() => setEditDialog(null)}
      onSave={handleSaveEvent}
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
            ...(layout === "medium" && { ml: `${RAIL_WIDTH}px` }),
          },
        }}
        slotProps={{ backdrop: { onClick: onDrawerClose } }}
      >
        {accountsPanel}
      </Drawer>
      {main}
      {eventDialog}
    </>
  );
}
