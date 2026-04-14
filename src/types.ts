export interface Contact {
  email: string;
  name: string;
}

export interface MailFolder {
  id: string;
  name: string;
  unreadCount: number;
}

export interface MailAccount {
  email: string;
  folders: MailFolder[];
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface MailMessage {
  id: string;
  from: Contact;
  to: Contact[];
  body: string;
  date: string;
  attachments?: Attachment[];
}

export interface MailThread {
  id: string;
  folderId: string;
  subject: string;
  read: boolean;
  messages: MailMessage[];
}

/* ── Chat types ── */

export type ChatMessageStatus = "sent" | "delivered" | "read";

export interface ChatMessage {
  id: string;
  chatId: string;
  fromId: string;
  body: string;
  timestamp: string;          // ISO date string
  status: ChatMessageStatus;  // for outgoing messages
}

export interface ChatParticipant {
  id: string;
  name: string;
  email: string;
  avatar: string;             // URL or initials placeholder
  status?: string;            // e.g. "online", "last seen 2h ago"
}

export interface Chat {
  id: string;
  isGroup: boolean;
  name: string;               // contact name or group name
  avatar: string;
  participants: string[];     // participant IDs
  messages: ChatMessage[];
  unreadCount: number;
  lastActivity: string;       // ISO date string
  description?: string;       // group description or contact bio
  accountEmail: string;       // which account owns this chat
}
