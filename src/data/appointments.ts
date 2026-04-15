import { accounts } from "./accounts";

export interface Appointment {
  id: string;
  accountEmail: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}

function iso(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const JOHN = "john@103mail.com";
const JANE = "jane@103mail.com";

export const accountColors: Record<string, string> = {
  [JOHN]: "#1976d2",
  [JANE]: "#9c27b0",
};

export const appointments: Appointment[] = [
  { id: "apt-1", accountEmail: JOHN, title: "Team standup", start: iso(0, 9, 0), end: iso(0, 9, 30), location: "Zoom" },
  { id: "apt-2", accountEmail: JOHN, title: "Design review", start: iso(0, 11, 0), end: iso(0, 12, 0), location: "Meeting room 2" },
  { id: "apt-2b", accountEmail: JANE, title: "Coffee chat", start: iso(0, 11, 30), end: iso(0, 12, 15), location: "Café Luna" },
  { id: "apt-3", accountEmail: JANE, title: "Lunch with Sarah", start: iso(1, 12, 30), end: iso(1, 13, 30), location: "Café Luna" },
  { id: "apt-3b", accountEmail: JOHN, title: "Budget sync", start: iso(1, 13, 0), end: iso(1, 14, 0), location: "Zoom" },
  { id: "apt-4", accountEmail: JOHN, title: "1:1 with manager", start: iso(1, 15, 0), end: iso(1, 15, 45) },
  { id: "apt-5", accountEmail: JOHN, title: "Sprint planning", start: iso(2, 10, 0), end: iso(2, 11, 30), location: "Main conference room" },
  { id: "apt-5b", accountEmail: JANE, title: "Research interview", start: iso(2, 10, 30), end: iso(2, 11, 15), location: "Zoom" },
  { id: "apt-6", accountEmail: JANE, title: "Dentist appointment", start: iso(3, 14, 0), end: iso(3, 15, 0), location: "Dr. Martinez office" },
  { id: "apt-6b", accountEmail: JOHN, title: "Architecture sync", start: iso(3, 14, 30), end: iso(3, 15, 30), location: "Meeting room 1" },
  { id: "apt-7", accountEmail: JOHN, title: "Product demo", start: iso(4, 16, 0), end: iso(4, 17, 0), location: "Zoom" },
  { id: "apt-8", accountEmail: JOHN, title: "Quarterly review", start: iso(-2, 13, 0), end: iso(-2, 14, 30) },
  { id: "apt-8b", accountEmail: JANE, title: "Project handoff", start: iso(-2, 13, 30), end: iso(-2, 14, 0), location: "Phone" },
  { id: "apt-9", accountEmail: JANE, title: "Yoga class", start: iso(-1, 18, 0), end: iso(-1, 19, 0), location: "Studio downtown" },
  { id: "apt-10", accountEmail: JOHN, title: "Client call — Acme Co.", start: iso(5, 10, 0), end: iso(5, 11, 0), location: "Phone" },
  { id: "apt-11", accountEmail: JOHN, title: "Workshop: Accessibility", start: iso(7, 9, 0), end: iso(7, 12, 0), location: "Training room" },
  { id: "apt-11b", accountEmail: JANE, title: "Morning jog", start: iso(7, 10, 0), end: iso(7, 11, 0), location: "Park loop" },
  { id: "apt-12", accountEmail: JANE, title: "Birthday dinner", start: iso(6, 19, 0), end: iso(6, 22, 0), location: "Osteria Verde" },
  { id: "apt-13", accountEmail: JANE, title: "Book club", start: iso(2, 19, 0), end: iso(2, 20, 30), location: "Library" },
  { id: "apt-14", accountEmail: JANE, title: "Personal trainer", start: iso(4, 7, 0), end: iso(4, 8, 0), location: "Gym" },
];

export { accounts };
