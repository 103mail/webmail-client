// Translation between the wire shapes in ./types.ts and the UI types in
// ../types.ts.
//
// Two differences drive everything here. Ids are numbers on the wire and
// strings in the components, so every id crosses as `String(id)`. And a thread
// on the wire carries a summary rather than its messages: the list endpoint
// answers one row per thread and the messages come from a second call. A thread
// therefore arrives with `messagesLoaded` false and a single placeholder
// message, and is filled in when it is opened.

import type {
  Attachment,
  Chat,
  ChatMessage,
  ChatParticipant,
  Contact,
  MailAccount,
  MailFolder,
  MailMessage,
  MailThread,
} from "../types";
import type {
  ApiAttachmentRef,
  ApiChat,
  ApiChatMessage,
  ApiContact,
  ApiFolder,
  ApiMailbox,
  ApiMessage,
  ApiThread,
  Party,
  UploadAttachment,
} from "./types";

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function toContact(party: Party): Contact {
  return { email: party.email, name: party.name || party.email };
}

export function toAttachment(ref: ApiAttachmentRef): Attachment {
  return {
    id: String(ref.attachmentId),
    name: ref.fileName,
    size: formatSize(ref.fileSize),
    type: ref.mimeType,
  };
}

export function toFolder(folder: ApiFolder): MailFolder {
  return {
    id: String(folder.folderId),
    name: folder.name,
    unreadCount: folder.unreadCount,
  };
}

// A mailbox plus its folders is what the sidebar calls an account. The address
// shown is the mailbox's sender address, which is the alias mail leaves from.
export function toAccount(mailbox: ApiMailbox, folders: ApiFolder[]): MailAccount {
  return {
    email: mailbox.senderEmail || mailbox.name,
    folders: folders.map(toFolder),
  };
}

export function toMessage(message: ApiMessage): MailMessage {
  return {
    id: String(message.messageId),
    from: { email: message.senderEmail, name: message.senderName || message.senderEmail },
    to: message.recipients.map(toContact),
    body: message.body,
    date: message.sentAt,
    attachments: message.attachments.map(toAttachment),
  };
}

// The list endpoint has no message bodies, so the thread gets one stand-in
// message built from the summary. It is replaced wholesale by withMessages once
// the thread is opened; nothing writes through it.
export function toThread(thread: ApiThread, folderId: string): MailThread {
  const participants = thread.subscribers.map(toContact);
  return {
    id: String(thread.threadId),
    folderId,
    subject: thread.subject,
    read: thread.unreadCount === 0,
    participants,
    updatedAt: thread.updatedAt,
    attachmentCount: thread.attachmentCount,
    messagesLoaded: false,
    messages: [
      {
        id: `${thread.threadId}-summary`,
        from: participants[0] ?? { email: "", name: "" },
        to: participants.slice(1),
        body: thread.summary,
        date: thread.updatedAt,
      },
    ],
  };
}

export function withMessages(thread: MailThread, messages: ApiMessage[]): MailThread {
  const adapted = messages.map(toMessage);
  return {
    ...thread,
    messages: adapted,
    messageCount: adapted.length,
    messagesLoaded: true,
    participants: [
      ...new Map(adapted.map((m) => [m.from.email, m.from])).values(),
    ],
  };
}

export function toContactList(contacts: ApiContact[]): Contact[] {
  return contacts.map((c) => ({ email: c.email, name: c.name || c.email }));
}

/* ── chat ── */

// The API identifies chat participants by address; the UI keys them by id. The
// address is the stable identifier, so it is used as the id.
export function toChatParticipants(chat: ApiChat): ChatParticipant[] {
  return chat.participants.map((p) => ({
    id: p.email,
    name: p.name || p.email,
    email: p.email,
    avatar: initials(p.name || p.email),
  }));
}

// The listing previews the newest message without its delivery state, so the
// stand-in is marked and the list leaves out the ticks rather than guess them.
function toPreview(chat: ApiChat): ChatMessage[] {
  if (!chat.lastMessage) return [];
  return [{
    id: `preview-${chat.chatId}`,
    chatId: String(chat.chatId),
    fromId: chat.lastMessage.senderEmail,
    body: chat.lastMessage.body,
    timestamp: chat.lastMessage.createdAt,
    status: "sent",
    isPreview: true,
  }];
}

export function toChat(chat: ApiChat, self: string, messages: ChatMessage[] = toPreview(chat)): Chat {
  const others = chat.participants.filter((p) => p.email !== self);
  const name =
    chat.name ?? (others[0] ? others[0].name || others[0].email : "Chat");
  return {
    id: String(chat.chatId),
    isGroup: chat.type === "group",
    name,
    avatar: initials(name),
    participants: chat.participants.map((p) => p.email),
    messages,
    unreadCount: chat.unreadCount,
    // The listing knows when the chat last moved, which is what it has to sort
    // by. Creation time is the fallback for a chat nobody has spoken in.
    lastActivity:
      messages[messages.length - 1]?.timestamp ?? chat.lastMessageAt ?? chat.createdAt,
    accountEmail: self,
  };
}

export function toChatMessage(message: ApiChatMessage, chatId: string): ChatMessage {
  return {
    id: String(message.messageId),
    chatId,
    fromId: message.senderEmail,
    body: message.body,
    timestamp: message.createdAt,
    status: message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent",
    attachments: message.attachments.map((a) => ({
      id: String(a.attachmentId),
      name: a.fileName,
      size: formatSize(a.fileSize),
      type: a.mimeType,
    })),
  };
}

function initials(name: string): string {
  const parts = name.replace(/@.*$/, "").split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── uploads ── */

// The API takes attachments as nested JSON objects, so the bytes go up base64
// encoded rather than as multipart.
export async function toUpload(file: File): Promise<UploadAttachment> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000; // btoa on the whole array blows the argument limit
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileData: btoa(binary),
  };
}

export function toUploads(files: File[]): Promise<UploadAttachment[]> {
  return Promise.all(files.map(toUpload));
}

// Attachment bytes come back base64 in JSON, so a download is built locally
// rather than pointed at a URL.
export function toBlobUrl(fileData: string, mimeType: string): string {
  const binary = atob(fileData);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}
