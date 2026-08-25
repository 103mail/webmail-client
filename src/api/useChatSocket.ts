// The chat socket as a hook: one connection for the whole chat section, opened
// while it is mounted and closed when it is not.
//
// It owns the connection and the frame handling. It does not own chat state:
// what it knows is handed to the caller, which decides whether to patch what is
// on screen or re-read. That keeps the socket from becoming a second source of
// truth alongside the REST calls.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "../auth/AuthContext";
import { ChatSocket } from "./socket";
import type { ServerFrame, SocketState } from "./socket";
import { toChatMessage } from "./adapt";
import type { ApiChatMessage } from "./types";
import type { ChatMessage } from "../types";

export interface Typist {
  chatId: string;
  userId: number;
  at: number;
}

interface Options {
  /** The conversation on screen, so a message for it can be appended. */
  openChatId: string | null;
  onMessage: (chatId: string, message: ChatMessage) => void;
  onChatChanged: () => void;
  onError: (message: string) => void;
}

export interface ChatSocketHandle {
  state: SocketState;
  sendMessage: (chatId: string, body: string) => void;
  setTyping: (chatId: string, on: boolean) => void;
  markRead: (chatId: string) => void;
  /** Who is currently typing, keyed by `${chatId}:${userId}`. */
  typists: Map<string, Typist>;
  /** Presence by address, which is how a chat lists its participants. */
  presence: Map<string, string>;
}

// A typing indicator the server never retracts must not stick. The server's own
// TTL is three seconds; this is the client-side equivalent for a retraction
// that gets lost.
const TYPING_TTL_MS = 5_000;

export function useChatSocket(options: Options): ChatSocketHandle {
  const { api } = useSession();
  const [state, setState] = useState<SocketState>("closed");
  const [typists, setTypists] = useState<Map<string, Typist>>(new Map());
  const [presence, setPresence] = useState<Map<string, string>>(new Map());
  const socketRef = useRef<ChatSocket | null>(null);

  // The handlers change on every render; the socket must not. Read through a
  // ref so the connection outlives them.
  const latest = useRef(options);
  latest.current = options;

  const handleFrame = useCallback((frame: ServerFrame) => {
    const opts = latest.current;
    switch (frame.type) {
      case "message":
      case "ack": {
        if (!frame.chatId || !frame.message) return;
        const message = toChatMessage(frame.message as ApiChatMessage, frame.chatId);
        opts.onMessage(frame.chatId, message);
        // A message arriving in the conversation already on screen has been
        // read the moment it is rendered, so the badge must not appear.
        if (frame.type === "message" && frame.chatId === latest.current.openChatId) {
          socketRef.current?.send({ type: "read", chatId: frame.chatId });
        }
        return;
      }
      case "typing": {
        if (!frame.chatId || frame.userId === undefined) return;
        const key = `${frame.chatId}:${frame.userId}`;
        setTypists((previous) => {
          const next = new Map(previous);
          if (frame.on === false) next.delete(key);
          else next.set(key, { chatId: frame.chatId!, userId: frame.userId!, at: Date.now() });
          return next;
        });
        return;
      }
      case "presence": {
        // Keyed by address rather than user id: a chat lists its participants
        // by address, and the two cannot be joined on the client.
        if (!frame.email || !frame.status) return;
        setPresence((previous) => new Map(previous).set(frame.email!, frame.status!));
        return;
      }
      case "error":
        opts.onError(frame.error ?? "The chat connection reported an error.");
        return;
      default:
        // ready and pong need no handling beyond having arrived.
        return;
    }
  }, []);

  useEffect(() => {
    const socket = new ChatSocket(api, { onFrame: handleFrame, onState: setState });
    socketRef.current = socket;
    socket.start();
    return () => {
      socket.stop();
      socketRef.current = null;
    };
  }, [api, handleFrame]);

  // Drop typing indicators the server never retracted.
  useEffect(() => {
    const timer = setInterval(() => {
      setTypists((previous) => {
        const cutoff = Date.now() - TYPING_TTL_MS;
        let changed = false;
        const next = new Map(previous);
        for (const [key, typist] of previous) {
          if (typist.at < cutoff) {
            next.delete(key);
            changed = true;
          }
        }
        return changed ? next : previous;
      });
    }, 2_000);
    return () => clearInterval(timer);
  }, []);

  const sendMessage = useCallback((chatId: string, body: string) => {
    socketRef.current?.send({ type: "message", chatId, body });
  }, []);

  const setTyping = useCallback((chatId: string, on: boolean) => {
    socketRef.current?.send({ type: "typing", chatId, on });
  }, []);

  const markRead = useCallback((chatId: string) => {
    socketRef.current?.send({ type: "read", chatId });
  }, []);

  // Opening a conversation is what marks it read, and the server clears the
  // unread count, so the list has to be re-read once that has happened.
  const openChatId = options.openChatId;
  useEffect(() => {
    if (!openChatId || state !== "open") return;
    socketRef.current?.send({ type: "read", chatId: openChatId });
    const timer = setTimeout(() => latest.current.onChatChanged(), 300);
    return () => clearTimeout(timer);
  }, [openChatId, state]);

  return { state, sendMessage, setTyping, markRead, typists, presence };
}
