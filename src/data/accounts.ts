import type { MailAccount } from "../types";

export const accounts: MailAccount[] = [
  {
    email: "john@103mail.com",
    folders: [{ id: "john-inbox", name: "Inbox" }],
  },
  {
    email: "jane@103mail.com",
    folders: [{ id: "jane-inbox", name: "Inbox" }],
  },
  {
    email: "empty@103mail.com",
    folders: [{ id: "empty-inbox", name: "Inbox" }],
  },
];
