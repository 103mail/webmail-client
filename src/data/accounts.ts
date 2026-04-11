import type { MailAccount } from "../types";

export const accounts: MailAccount[] = [
  {
    email: "john@example.com",
    folders: [{ id: "john-inbox", name: "Inbox" }],
  },
  {
    email: "jane@work.org",
    folders: [{ id: "jane-inbox", name: "Inbox" }],
  },
];
