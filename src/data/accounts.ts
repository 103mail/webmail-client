import type { MailAccount } from "../types";

export const accounts: MailAccount[] = [
  {
    email: "john@103mail.com",
    folders: [
      { id: "john-inbox", name: "Inbox", unreadCount: 2 },
      { id: "john-spam", name: "Spam", unreadCount: 0 },
    ],
  },
  {
    email: "jane@103mail.com",
    folders: [{ id: "jane-inbox", name: "Inbox", unreadCount: 1 }],
  },
  {
    email: "empty@103mail.com",
    folders: [{ id: "empty-inbox", name: "Inbox", unreadCount: 0 }],
  },
];
