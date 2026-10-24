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
  /* Filled in from the thread listing, which knows these without having to
     fetch the messages. Absent on threads that never came from the API. */
  participants?: Contact[];
  updatedAt?: string;
  messageCount?: number;
  attachmentCount?: number;
  /* False until the messages have actually been fetched; until then `messages`
     holds a single stand-in built from the thread summary. */
  messagesLoaded?: boolean;
}

/* ── Chat types ── */

export type ChatMessageStatus = "sent" | "delivered" | "read";

export interface ChatAttachment {
  id: string;
  name: string;
  size: string;
  type: string;               // MIME type
}

export interface ChatImage {
  id: string;
  url: string;                // image URL (http or object URL)
  width?: number;
  height?: number;
  caption?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  fromId: string;
  body: string;
  timestamp: string;          // ISO date string
  status: ChatMessageStatus;  // for outgoing messages
  attachments?: ChatAttachment[];
  images?: ChatImage[];
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
