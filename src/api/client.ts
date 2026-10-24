// The HTTP client for webmail-server.
//
// Every path is /api/v1/{group}/{entity}/{id}. A GET or DELETE puts its
// parameters in the query string and everything else sends a JSON body, which
// is what the server's api.parseBody expects. A request carrying attachments
// has to be JSON, because they are nested objects.

import type {
  ApiAttachment,
  ApiCalendar,
  ApiChat,
  ApiChatMessage,
  ApiChatSession,
  ApiChatParticipant,
  ApiContact,
  ApiFolder,
  ApiMailbox,
  ApiMeetingsByDate,
  ApiMessage,
  ApiPresence,
  ApiThread,
  ApiToken,
  ApiTyping,
  ApiUser,
  NewMeeting,
  UploadAttachment,
} from "./types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

type Params = Record<string, string | number | boolean | undefined>;

export class ApiClient {
  private readonly base: string;
  private readonly token: () => string | null;
  // Called when the server rejects the token, so the app can drop the session
  // instead of looping on 401s.
  private readonly onUnauthorized: () => void;

  constructor(base: string, token: () => string | null, onUnauthorized: () => void = () => {}) {
    this.base = base;
    this.token = token;
    this.onUnauthorized = onUnauthorized;
  }

  private headers(json: boolean): HeadersInit {
    const headers: Record<string, string> = {};
    const value = this.token();
    if (value) headers.Authorization = `Bearer ${value}`;
    if (json) headers["Content-Type"] = "application/json";
    return headers;
  }

  private async send<T>(
    method: string,
    path: string,
    params?: Params,
    body?: unknown
  ): Promise<T> {
    const url = new URL(`${this.base}${path}`, window.location.origin);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }

    const response = await fetch(url.toString(), {
      method,
      headers: this.headers(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401) {
      this.onUnauthorized();
      throw new ApiError(401, "not signed in");
    }
    if (!response.ok) {
      throw new ApiError(response.status, `${method} ${path}: ${response.status}`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  private get<T>(path: string, params?: Params) {
    return this.send<T>("GET", path, params);
  }
  private post<T>(path: string, body: unknown) {
    return this.send<T>("POST", path, undefined, body);
  }
  private put<T>(path: string, body: unknown) {
    return this.send<T>("PUT", path, undefined, body);
  }
  private del<T>(path: string, params?: Params) {
    return this.send<T>("DELETE", path, params);
  }

  /* ── auth ── */

  // The only call that does not need a token. Reuses the token of the same
  // name when one already exists, so signing in twice does not pile up rows.
  login(email: string, password: string, name = "Session") {
    return this.post<ApiToken | null>("/auth/token", { name, email, password });
  }

  currentUser() {
    return this.get<ApiUser | null>("/auth/token");
  }

  /* ── email ── */

  mailboxes(customerId: number, search?: string) {
    return this.get<ApiMailbox[]>(`/email/mailbox/${customerId}`, { search });
  }

  folders(mailboxId: number, search?: string) {
    return this.get<ApiFolder[]>(`/email/folder/${mailboxId}`, { search });
  }

  threads(folderId: number, search?: string) {
    return this.get<ApiThread[]>(`/email/thread/${folderId}`, { search });
  }

  messages(threadId: number, search?: string) {
    return this.get<ApiMessage[]>(`/email/message/${threadId}`, { search });
  }

  // Starts a new thread in a folder. Quoting deliberately has no backlink: a
  // quote is a new independent thread (ADR 4).
  addThread(
    folderId: number,
    subject: string,
    subscribers: string[],
    body: string,
    attachments: UploadAttachment[] = []
  ) {
    return this.post<number | null>(`/email/thread/${folderId}`, {
      subject,
      subscribers,
      body,
      attachments,
    });
  }

  addMessage(threadId: number, body: string, attachments: UploadAttachment[] = []) {
    return this.post<number | null>(`/email/message/${threadId}`, { body, attachments });
  }

  markMessageRead(messageId: number) {
    return this.put<boolean>(`/email/message/${messageId}`, {});
  }

  moveThread(threadId: number, folderId: number) {
    return this.put<boolean>(`/email/thread/${threadId}`, { folderId });
  }

  // Removes this user's projection of the thread. The canonical g_thread and
  // its messages are append-only and stay (ADR 5).
  deleteThread(threadId: number) {
    return this.del<boolean>(`/email/thread/${threadId}`);
  }

  addSubscriber(threadId: number, email: string) {
    return this.post<boolean>(`/email/subscriber/${threadId}`, { email });
  }

  attachment(attachmentId: number) {
    return this.get<ApiAttachment>(`/email/attachment/${attachmentId}`);
  }

  contacts(customerId: number, search?: string) {
    return this.get<ApiContact[]>(`/email/contact/${customerId}`, { search });
  }

  addContact(customerId: number, email: string, name: string) {
    return this.post<number | null>(`/email/contact/${customerId}`, { email, name });
  }

  /* ── calendar ── */

  calendars(customerId: number) {
    return this.get<ApiCalendar[]>(`/calendar/calendar/${customerId}`);
  }

  // fromDate and untilDate are YYYY-MM-DD; untilDate is exclusive.
  meetings(calendarIds: number[], fromDate: string, untilDate: string) {
    return this.get<ApiMeetingsByDate>(`/calendar/meeting/${calendarIds.join(",")}`, {
      fromDate,
      untilDate,
    });
  }

  addMeeting(calendarId: number, meeting: NewMeeting) {
    return this.post<number | null>(`/calendar/meeting/${calendarId}`, meeting);
  }

  setRsvp(meetingId: number, willAttend: "yes" | "no" | "maybe") {
    return this.put<boolean>(`/calendar/meeting/${meetingId}`, { willAttend });
  }

  deleteMeeting(meetingId: number) {
    return this.del<boolean>(`/calendar/meeting/${meetingId}`);
  }

  addAttendee(meetingId: number, email: string) {
    return this.post<boolean>(`/calendar/attendee/${meetingId}`, { email });
  }

  /* ── chat ── */

  // Chats belong to a mailbox, not to the customer.
  chats(mailboxId: number, search?: string) {
    return this.get<ApiChat[]>(`/chat/chat/${mailboxId}`, { search });
  }

  chatMessages(chatId: number, search?: string) {
    return this.get<ApiChatMessage[]>(`/chat/message/${chatId}`, { search });
  }

  addChatMessage(chatId: number, body: string, attachments: UploadAttachment[] = []) {
    return this.post<number | null>(`/chat/message/${chatId}`, { body, attachments });
  }

  addChat(mailboxId: number, type: "direct" | "group", participants: string[], name?: string) {
    return this.post<number | null>(`/chat/chat/${mailboxId}`, { type, participants, name });
  }

  editChat(chatId: number, changes: { name?: string; muted?: boolean }) {
    return this.put<boolean>(`/chat/chat/${chatId}`, changes);
  }

  // Hides the chat from this user only. They stay a participant, so the next
  // message brings it back with its history.
  deleteChat(chatId: number) {
    return this.del<boolean>(`/chat/chat/${chatId}`);
  }

  chatParticipants(chatId: number) {
    return this.get<ApiChatParticipant[]>(`/chat/participant/${chatId}`);
  }

  // Takes a participant id, not a chat id. Leaving is removing yourself.
  removeChatParticipant(participantId: number) {
    return this.del<boolean>(`/chat/participant/${participantId}`);
  }

  presence(userIds: number[]) {
    return this.get<ApiPresence[]>(`/chat/presence/${userIds.join(",")}`);
  }

  setPresence(userId: number, status: "online" | "offline" | "away") {
    return this.put<boolean>(`/chat/presence/${userId}`, { status });
  }

  typing(chatId: number) {
    return this.get<ApiTyping[]>(`/chat/typing/${chatId}`);
  }

  startTyping(chatId: number) {
    return this.post<boolean>(`/chat/typing/${chatId}`, {});
  }

  stopTyping(chatId: number) {
    return this.del<boolean>(`/chat/typing/${chatId}`);
  }

  chatAttachment(attachmentId: number) {
    return this.get<ApiAttachment>(`/chat/attachment/${attachmentId}`);
  }

  // Mints the opaque ClientId a chat WebSocket is opened with. It is
  // single-use, so a reconnect asks for a new one (server ADR 18).
  chatSession() {
    return this.post<ApiChatSession>("/chat/session", {});
  }
}
