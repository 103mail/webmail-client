import type { Contact } from "./types";

const REPLY_PREFIX = "draft:reply:";
const COMPOSE_PREFIX = "draft:compose:";

export interface ReplyDraft {
  text: string;
}

export interface ComposeDraft {
  to: Contact[];
  subject: string;
  body: string;
}

export function loadReplyDraft(threadId: string): ReplyDraft | null {
  try {
    const raw = localStorage.getItem(REPLY_PREFIX + threadId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveReplyDraft(threadId: string, draft: ReplyDraft): void {
  if (draft.text.trim()) {
    localStorage.setItem(REPLY_PREFIX + threadId, JSON.stringify(draft));
  } else {
    localStorage.removeItem(REPLY_PREFIX + threadId);
  }
}

export function clearReplyDraft(threadId: string): void {
  localStorage.removeItem(REPLY_PREFIX + threadId);
}

export function loadComposeDraft(folderId: string): ComposeDraft | null {
  try {
    const raw = localStorage.getItem(COMPOSE_PREFIX + folderId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveComposeDraft(folderId: string, draft: ComposeDraft): void {
  if (draft.to.length > 0 || draft.subject.trim() || draft.body.trim()) {
    localStorage.setItem(COMPOSE_PREFIX + folderId, JSON.stringify(draft));
  } else {
    localStorage.removeItem(COMPOSE_PREFIX + folderId);
  }
}

export function clearComposeDraft(folderId: string): void {
  localStorage.removeItem(COMPOSE_PREFIX + folderId);
}
