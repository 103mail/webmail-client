// The wire shapes of webmail-server, mirroring ../webmail/web/openapi/v1/.
//
// These are what the API actually returns. They are deliberately kept separate
// from the UI types in ../types.ts, which the components speak: ids are numbers
// here and strings there, and a thread carries its messages there but not here.
// api/adapt.ts is the only place the two meet.

export interface Party {
  email: string;
  name: string;
}

/* ── auth ── */

export interface ApiUser {
  userId: number;
  customerId: number;
  email: string;
  name: string;
}

export interface ApiToken {
  name: string;
  value: string;
}

/* ── email ── */

export interface ApiMailbox {
  mailboxId: number;
  name: string;
  color: string;
  unreadCount: number;
  isDefault: boolean;
  isShared: boolean;
  senderEmail: string;
  senderName: string;
}

export interface ApiFolder {
  folderId: number;
  name: string;
  unreadCount: number;
  isDefault: boolean;
}

export interface ApiThread {
  threadId: number;
  subject: string;
  summary: string;
  unreadCount: number;
  subscribers: Party[];
  attachmentCount: number;
  updatedAt: string;
}

export interface ApiAttachmentRef {
  attachmentId: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface ApiMessage {
  messageId: number;
  senderEmail: string;
  senderName: string;
  recipients: Party[];
  body: string;
  sentAt: string;
  readAt: string | null;
  attachments: ApiAttachmentRef[];
}

export interface ApiAttachment {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: string; // base64
}

export interface ApiContact {
  contactId: number;
  email: string;
  name: string;
}

/* ── calendar ── */

export interface ApiCalendar {
  calendarId: number;
  mailboxId: number;
  name: string;
  color: string;
  isShared: boolean;
}

export interface ApiMeeting {
  meetingId: number;
  calendarId: number;
  title: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  isAllDay: boolean;
  organizerEmail: string;
  organizerName: string;
  description: string;
  willAttend: "yes" | "no" | "maybe" | null;
  // The server does the day-view overlap arithmetic, so the client does not
  // have to. See internal/calendar/layout.go.
  widthFraction: number;
  horizontalPosition: number;
}

// GET /calendar/meeting/{ids} answers a map of YYYY-MM-DD to that day's
// meetings, with every day in the range present even when empty.
export type ApiMeetingsByDate = Record<string, ApiMeeting[]>;

export interface NewMeeting {
  title: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  attendees: string[];
  isAllDay?: boolean;
  repeatRule?: string;
  descriptionHtml?: string;
}

/* ── chat ── */

export interface ApiParticipantRef {
  email: string;
  name: string;
  role: "creator" | "admin" | "member";
}

export interface ApiChat {
  chatId: number;
  type: "direct" | "group";
  name: string | null;
  unreadCount: number;
  muted: boolean;
  notificationPreference: "all" | "mentions_only" | "none";
  participants: ApiParticipantRef[];
  createdAt: string;
  /** When the newest message was sent, or empty for a chat with none. */
  lastMessageAt: string;
}

export interface ApiDeliveryStatus {
  sent: number;
  delivered: number;
  read: number;
}

export interface ApiChatMessage {
  messageId: number;
  senderEmail: string;
  senderName: string;
  body: string;
  bodyHtml: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  attachments: ApiAttachmentRef[];
  deliveryStatus: ApiDeliveryStatus | null;
}

export interface ApiChatSession {
  clientId: string;
  expiresAt: string;
}

export interface ApiPresence {
  userId: number;
  status: "online" | "offline" | "away";
  lastActivityAt: string;
}

export interface ApiTyping {
  userId: number;
  userName: string;
  startedAt: string;
  expiresAt: string;
}

/* ── requests carrying files ── */

export interface UploadAttachment {
  fileName: string;
  mimeType: string;
  fileData: string; // base64, no data: prefix
}
