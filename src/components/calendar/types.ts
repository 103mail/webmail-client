export type CalendarViewKind =
  | "day"
  | "3day"
  | "week5"
  | "week7"
  | "month"
  | "agenda";

export interface CalendarEvent {
  id: string;
  accountEmail: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  allDay?: boolean;
  color: string;
}
