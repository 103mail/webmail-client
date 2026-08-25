// Data hooks over ApiClient.
//
// Deliberately plain: a request, a loading flag, an error, and a reload. There
// is no cache and no query library, because every screen here reads a small
// list that the user has just navigated to, and a stale list that silently
// disagrees with the server is worse than a second request.
//
// Anything that mutates returns a promise and leaves reloading to the caller,
// so the component decides what to refresh and when.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "../auth/AuthContext";
import type { Chat, ChatMessage, ChatParticipant, Contact, MailAccount, MailThread } from "../types";
import type { ApiCalendar, ApiMailbox, ApiMeetingsByDate } from "./types";
import {
  toAccount,
  toChat,
  toChatParticipants,
  toChatMessage,
  toContactList,
  toThread,
  withMessages,
} from "./adapt";

export interface Async<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  reload: () => void;
  // Patches the loaded value in place, for the cases where something already
  // knows what changed and a re-read would only add latency.
  setData: (update: (previous: T) => T) => void;
}

// Runs `work` whenever `deps` change, keeping the previous value visible while
// the next one loads. Results from a superseded run are dropped, so a fast
// second navigation cannot be overwritten by a slow first one.
function useAsync<T>(work: () => Promise<T>, initial: T, deps: unknown[]): Async<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);
  const run = useRef(0);

  useEffect(() => {
    const mine = ++run.current;
    setLoading(true);
    work().then(
      (value) => {
        if (run.current !== mine) return;
        setData(value);
        setError(null);
        setLoading(false);
      },
      (err: unknown) => {
        if (run.current !== mine) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
    // work is rebuilt on every render; deps are what actually decide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const patch = useCallback((update: (previous: T) => T) => setData(update), []);
  return { data, loading, error, reload, setData: patch };
}

/* ── mail ── */

export interface Accounts {
  accounts: MailAccount[];
  // The raw mailboxes too. A calendar is a mailbox, so the calendar section
  // needs the ids that MailAccount does not carry.
  mailboxes: ApiMailbox[];
  // Which mailbox a folder belongs to, and which folder is the default. The
  // sidebar works in folder ids; composing needs the folder, so this is enough.
  folderToMailbox: Map<string, number>;
  defaultFolderId: string | null;
}

const NO_ACCOUNTS: Accounts = {
  accounts: [],
  mailboxes: [],
  folderToMailbox: new Map(),
  defaultFolderId: null,
};

// Mailboxes and their folders. Two round trips per mailbox is the shape of the
// API: /email/mailbox/{customerId} then /email/folder/{mailboxId}.
export function useAccounts(): Async<Accounts> {
  const { user, api } = useSession();
  return useAsync<Accounts>(
    async () => {
      const mailboxes = await api.mailboxes(user.customerId);
      const folderSets = await Promise.all(
        mailboxes.map((mailbox) => api.folders(mailbox.mailboxId))
      );
      const folderToMailbox = new Map<string, number>();
      let defaultFolderId: string | null = null;
      mailboxes.forEach((mailbox, i) => {
        for (const folder of folderSets[i]) {
          folderToMailbox.set(String(folder.folderId), mailbox.mailboxId);
          if (defaultFolderId === null || (mailbox.isDefault && folder.isDefault)) {
            defaultFolderId ??= String(folder.folderId);
            if (mailbox.isDefault && folder.isDefault) defaultFolderId = String(folder.folderId);
          }
        }
      });
      return {
        accounts: mailboxes.map((mailbox, i) => toAccount(mailbox, folderSets[i])),
        mailboxes,
        folderToMailbox,
        defaultFolderId,
      };
    },
    NO_ACCOUNTS,
    [user.customerId]
  );
}

// The threads in a folder. `search` is passed through to the server, which
// searches subject, body and sender; it is not a client-side filter.
export function useThreads(folderId: string | null, search: string): Async<MailThread[]> {
  const { api } = useSession();
  return useAsync<MailThread[]>(
    async () => {
      if (!folderId) return [];
      const threads = await api.threads(Number(folderId), search || undefined);
      return threads.map((thread) => toThread(thread, folderId));
    },
    [],
    [folderId, search]
  );
}

// Fills a thread's messages in on first open, and marks the unread ones read.
// The summary stand-in from the listing is replaced, never merged.
export function useThreadMessages(thread: MailThread | null): {
  thread: MailThread | null;
  loading: boolean;
  error: Error | null;
} {
  const { api } = useSession();
  const [filled, setFilled] = useState<MailThread | null>(thread);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const run = useRef(0);

  useEffect(() => {
    if (!thread) {
      setFilled(null);
      return;
    }
    setFilled(thread);
    if (thread.messagesLoaded) return;

    const mine = ++run.current;
    setLoading(true);
    api.messages(Number(thread.id)).then(
      async (messages) => {
        if (run.current !== mine) return;
        setFilled(withMessages(thread, messages));
        setError(null);
        setLoading(false);
        // Reading a thread is what marks its messages read. Failures here are
        // not worth surfacing: the thread is on screen either way.
        await Promise.all(
          messages.filter((m) => m.readAt === null).map((m) => api.markMessageRead(m.messageId))
        ).catch(() => {});
      },
      (err: unknown) => {
        if (run.current !== mine) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
  }, [thread, api]);

  return { thread: filled, loading, error };
}

export function useContacts(): Async<Contact[]> {
  const { user, api } = useSession();
  return useAsync<Contact[]>(
    async () => toContactList(await api.contacts(user.customerId)),
    [],
    [user.customerId]
  );
}

/* ── calendar ── */

export function useCalendars(): Async<ApiCalendar[]> {
  const { user, api } = useSession();
  return useAsync<ApiCalendar[]>(
    () => api.calendars(user.customerId),
    [],
    [user.customerId]
  );
}

// `fromDate` and `untilDate` are YYYY-MM-DD, and untilDate is exclusive. The
// server returns every day in the range, empty ones included, and has already
// done the day-view overlap arithmetic.
export function useMeetings(
  calendarIds: number[],
  fromDate: string,
  untilDate: string
): Async<ApiMeetingsByDate> {
  const { api } = useSession();
  const key = calendarIds.join(",");
  return useAsync<ApiMeetingsByDate>(
    async () => (key ? api.meetings(calendarIds, fromDate, untilDate) : {}),
    {},
    [key, fromDate, untilDate]
  );
}

/* ── chat ── */

// Chat is live over a WebSocket (server ADR 13 and ADR 18). The socket does not
// own the chat state: it tells these hooks what changed, and they re-read or
// patch what the components already render. That keeps one representation of a
// chat message rather than a REST one and a socket one.

export interface ChatList {
  chats: Chat[];
  // Display names by address. The chat rows carry them, and the UI keys
  // participants by address because that is what a chat message is sent from.
  participants: Map<string, ChatParticipant>;
}

const NO_CHATS: ChatList = { chats: [], participants: new Map() };

export function useChats(search: string): Async<ChatList> {
  const { user, api } = useSession();
  return useAsync<ChatList>(
    async () => {
      const chats = await api.chats(user.customerId, search || undefined);
      const participants = new Map<string, ChatParticipant>();
      for (const chat of chats) {
        for (const p of toChatParticipants(chat)) {
          if (!participants.has(p.email)) participants.set(p.email, p);
        }
      }
      return { chats: chats.map((chat) => toChat(chat, user.email)), participants };
    },
    NO_CHATS,
    [user.customerId, search]
  );
}

export function useChatMessages(chatId: string | null): Async<ChatMessage[]> & {
  append: (message: ChatMessage) => void;
} {
  const { api } = useSession();
  const result = useAsync<ChatMessage[]>(
    async () => {
      if (!chatId) return [];
      // The API answers newest first, which is what a mail thread wants and the
      // opposite of what a conversation does: the pane renders top to bottom
      // and appends what you send at the end.
      const messages = await api.chatMessages(Number(chatId));
      return messages
        .map((message) => toChatMessage(message, chatId))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },
    [],
    [chatId]
  );

  // A message arriving on the socket is appended rather than triggering a
  // re-read: the frame carries the whole message, and re-reading would put a
  // round trip between someone sending and everyone seeing it.
  const append = useCallback((message: ChatMessage) => {
    result.setData((previous) => {
      if (previous.some((m) => m.id === message.id)) return previous;
      return [...previous, message].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
  }, [result]);

  return { ...result, append };
}
