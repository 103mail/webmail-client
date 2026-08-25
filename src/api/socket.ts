// The chat WebSocket.
//
// Connections terminate in ws2api, not in the API server, so the server holds
// none of them and every event is an HTTP hop behind the scenes. None of that
// is visible here: this is an ordinary socket that reconnects. See the server's
// ADR 13 and ADR 18.
//
// Opening one is two steps. A ClientId is minted by an authenticated call, then
// the socket is opened at /ws/{clientId}. The id is opaque and single-use, so a
// reconnect mints a new one.

import type { ApiClient } from "./client";

export type ClientFrame =
  | { type: "hello" }
  | { type: "ping" }
  | { type: "message"; id?: string; chatId: string; body: string }
  | { type: "typing"; chatId: string; on: boolean }
  | { type: "read"; chatId: string }
  | { type: "presence"; status: "online" | "away" | "offline" };

export interface ServerFrame {
  type: "ready" | "ack" | "error" | "pong" | "message" | "typing" | "presence";
  id?: string;
  chatId?: string;
  userId?: number;
  userName?: string;
  email?: string;
  status?: string;
  on?: boolean;
  messageId?: string;
  message?: unknown;
  error?: string;
}

export type SocketState = "connecting" | "open" | "closed";

interface Handlers {
  onFrame: (frame: ServerFrame) => void;
  onState: (state: SocketState) => void;
}

// The server sweeps a session that has gone quiet after five minutes, so the
// ping has to be comfortably inside that. It is also what keeps presence fresh.
const PING_MS = 45_000;

// Reconnect backoff. Capped low because a chat that is silently disconnected is
// worse than one that retries a little too eagerly.
const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 20_000;

export class ChatSocket {
  private readonly api: ApiClient;
  private readonly handlers: Handlers;
  private socket: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private stopped = false;
  // Frames written before the socket opened. A send during the reconnect gap
  // would otherwise be lost silently, which for a chat message is the worst
  // possible failure.
  private queue: ClientFrame[] = [];

  constructor(api: ApiClient, handlers: Handlers) {
    this.api = api;
    this.handlers = handlers;
  }

  start() {
    this.stopped = false;
    void this.connect();
  }

  stop() {
    this.stopped = true;
    this.clearTimers();
    this.queue = [];
    if (this.socket) {
      const socket = this.socket;
      this.socket = null;
      // Drop the handlers first: a close we asked for must not schedule a
      // reconnect.
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.close();
    }
    this.handlers.onState("closed");
  }

  send(frame: ClientFrame) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(frame));
      return;
    }
    // Typing and presence are momentary; replaying them after a reconnect would
    // report something that is no longer true. A message is worth keeping.
    if (frame.type === "message") this.queue.push(frame);
  }

  private async connect() {
    if (this.stopped) return;
    this.handlers.onState("connecting");
    try {
      const session = await this.api.chatSession();
      if (this.stopped) return;

      const url = new URL(`/ws/${session.clientId}`, window.location.origin);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(url.toString());
      this.socket = socket;

      socket.onopen = () => {
        this.attempt = 0;
        this.handlers.onState("open");
        socket.send(JSON.stringify({ type: "hello" }));
        for (const frame of this.queue.splice(0)) {
          socket.send(JSON.stringify(frame));
        }
        this.pingTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_MS);
      };

      socket.onmessage = (event) => {
        // The proxy writes the response to every client frame back on the same
        // socket, and a handler with nothing to say answers with an empty body.
        if (typeof event.data !== "string" || event.data.trim() === "") return;
        try {
          this.handlers.onFrame(JSON.parse(event.data) as ServerFrame);
        } catch {
          /* a frame that is not JSON is not ours to interpret */
        }
      };

      socket.onclose = () => this.scheduleReconnect();
      socket.onerror = () => socket.close();
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.clearTimers();
    this.socket = null;
    if (this.stopped) return;
    this.handlers.onState("closed");

    // Full jitter, so a server coming back does not get every client at once.
    const ceiling = Math.min(RECONNECT_MAX_MS, RECONNECT_MIN_MS * 2 ** this.attempt);
    this.attempt = Math.min(this.attempt + 1, 8);
    const delay = RECONNECT_MIN_MS + Math.random() * (ceiling - RECONNECT_MIN_MS);
    this.retryTimer = setTimeout(() => void this.connect(), delay);
  }

  private clearTimers() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}
