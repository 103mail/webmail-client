import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Divider,
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
import { CalendarToolbar } from "./calendar/CalendarToolbar";
import { MonthView } from "./calendar/MonthView";
import { TimeGridView } from "./calendar/TimeGridView";
import type { CalendarEvent, CalendarViewKind } from "./calendar/types";
import { rangeForView } from "./calendar/utils";

const ACCOUNTS_PANEL_WIDTH = 240;

export function CalendarView() {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));

  const availableViews = useMemo<CalendarViewKind[]>(() => {
    if (!isMd) return ["day", "3day", "month", "agenda"];
    return ["week5", "week7", "month", "agenda"];
  }, [isMd]);

  const [view, setView] = useState<CalendarViewKind>(() =>
    isMd ? "week7" : "3day",
  );
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [enabledAccounts, setEnabledAccounts] = useState<Set<string>>(
    () => new Set(accounts.map((a) => a.email)),
  );

  // If the view becomes unavailable on breakpoint change, fall back.
  if (!availableViews.includes(view)) {
    const fallback = availableViews[0];
    setTimeout(() => setView(fallback), 0);
  }

  const events = useMemo<CalendarEvent[]>(
    () =>
      appointments
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
    [enabledAccounts],
  );

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
      return `${format(anchor, "MMM d, yyyy")} –`;
    }
    if (gridDays.length === 1) {
      return format(gridDays[0], "EEEE, MMMM d, yyyy");
    }
    const first = gridDays[0];
    const last = gridDays[gridDays.length - 1];
    if (isSameMonth(first, last)) {
      return `${format(first, "MMMM d")} – ${format(last, "d, yyyy")}`;
    }
    return `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;
  }, [view, anchor, gridDays]);

  const goPrev = () => {
    if (view === "month") setAnchor((a) => addMonths(a, -1));
    else if (view === "agenda") setAnchor((a) => addDays(a, -14));
    else setAnchor((a) => addDays(a, -gridDays.length));
  };
  const goNext = () => {
    if (view === "month") setAnchor((a) => addMonths(a, 1));
    else if (view === "agenda") setAnchor((a) => addDays(a, 14));
    else setAnchor((a) => addDays(a, gridDays.length));
  };
  const goToday = () => setAnchor(new Date());

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
    return <TimeGridView days={gridDays} events={events} />;
  })();

  const main = (
    <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: 0, p: { xs: 1, md: 2 }, gap: 1 }}>
      <CalendarToolbar
        title={title}
        view={view}
        availableViews={availableViews}
        onView={setView}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />
      {!isLg && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {accounts.map((a) => {
            const enabled = enabledAccounts.has(a.email);
            const color = accountColors[a.email] ?? "#607d8b";
            return (
              <Chip
                key={a.email}
                label={a.email}
                size="small"
                onClick={() => toggleAccount(a.email)}
                sx={{
                  bgcolor: enabled ? color : "transparent",
                  color: enabled ? "#fff" : "text.primary",
                  border: "1px solid",
                  borderColor: color,
                  "&:hover": { bgcolor: enabled ? color : "action.hover" },
                }}
              />
            );
          })}
        </Box>
      )}
      <Box sx={{ flexGrow: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{body}</Box>
    </Box>
  );

  if (isLg) {
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
          <AccountsPanel
            accounts={accounts}
            colors={accountColors}
            enabled={enabledAccounts}
            onToggle={toggleAccount}
          />
          <Divider />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>{main}</Box>
      </Box>
    );
  }

  return main;
}
