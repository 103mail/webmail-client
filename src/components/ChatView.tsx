import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputBase,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Popover,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import AddCommentIcon from "@mui/icons-material/AddComment";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import type { Chat, ChatAttachment, ChatImage, ChatMessage, ChatParticipant } from "../types";
import { useSession } from "../auth/AuthContext";
import { useChatMailbox, useChats, useChatMessages } from "../api/hooks";
import { useChatSocket } from "../api/useChatSocket";
import { toUploads, toBlobUrl } from "../api/adapt";
import { NewChatDialog } from "./NewChatDialog";

export interface ChatHeaderState {
  /** Title/subtitle to surface in the AppBar when the conversation is the only visible pane. */
  title?: string;
  subtitle?: string;
  /** Mobile back navigation from the conversation pane. */
  onBack?: () => void;
  /** Search state: when `searching` is true the AppBar should render the search InputBase. */
  showSearchButton: boolean;
  searching: boolean;
  searchInput: string;
  onSearchStart: () => void;
  onSearchInputChange: (value: string) => void;
  onSearchCommit: () => void;
  onSearchCancel: () => void;
  /** Conversation actions — only populated when a chat is selected. */
  isMuted?: boolean;
  onToggleMute?: () => void;
  onDelete?: () => void;
  onLeave?: () => void;
  showInfoButton?: boolean;
  onToggleInfo?: () => void;
}

interface ChatViewProps {
  onHeaderChange?: (state: ChatHeaderState | null) => void;
}

/* ── Helpers ── */
const EMOJI_ONLY_RE = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f\s]+$/u;
function isEmojiOnly(text: string) {
  return text.length <= 15 && EMOJI_ONLY_RE.test(text.trim());
}

/* ── Constants ── */

const EMOJI_PICKS = [
  "😀","😂","😍","🥰","😎","🤔","👍","👎","🙌","🎉",
  "❤️","🔥","💯","😢","😡","🤣","😊","🥳","🤩","😇",
  "👋","✅","💪","🙏","😬","🤷","💜","🚀","🎨","☕",
];

// liveStatus reports the other party's presence in a direct chat. The socket
// reports presence by user id and the chat lists participants by address, so
// this falls back to whatever the participant record already said when the two
// cannot be joined.
function liveStatus(
  chat: Chat,
  me: string,
  participants: Map<string, ChatParticipant>,
  presence: Map<string, string>,
): string {
  const other = chat.participants.find((p) => p !== me) ?? "";
  return presence.get(other) ?? participants.get(other)?.status ?? "";
}

/* ── Helpers ── */
function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = ["#e91e63","#9c27b0","#673ab7","#3f51b5","#2196f3","#009688","#4caf50","#ff9800","#795548","#607d8b"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  if (diffDays === 0) return time;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function shouldShowDateSeparator(prev: ChatMessage | undefined, curr: ChatMessage) {
  if (!prev) return true;
  const a = new Date(prev.timestamp).toDateString();
  const b = new Date(curr.timestamp).toDateString();
  return a !== b;
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentIcon(type: string) {
  if (type.includes("pdf")) return <PictureAsPdfIcon fontSize="small" />;
  if (type.includes("word") || type.includes("document")) return <DescriptionIcon fontSize="small" />;
  return <InsertDriveFileIcon fontSize="small" />;
}

function ImageGrid({ images, onOpen }: { images: ChatImage[]; onOpen: (url: string) => void }) {
  const count = images.length;
  const cols = count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 2;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 0.5,
        mt: 0.5,
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      {images.map((img) => (
        <Box key={img.id} sx={{ position: "relative" }}>
          <Box
            component="img"
            src={img.url}
            alt={img.caption ?? ""}
            loading="lazy"
            onClick={() => onOpen(img.url)}
            sx={{
              width: "100%",
              aspectRatio: count === 1 ? "16/10" : "1 / 1",
              objectFit: "cover",
              display: "block",
              cursor: "zoom-in",
              bgcolor: "grey.200",
            }}
          />
          {img.caption && (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                px: 1, py: 0.3,
                color: "common.white",
                background: "linear-gradient(transparent, rgba(0,0,0,0.55))",
                fontSize: 11,
              }}
            >
              {img.caption}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

function AttachmentList({
  attachments,
  onDownload,
}: {
  attachments: ChatAttachment[];
  onDownload: (id: string, name: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
      {attachments.map((att) => (
        <Box
          key={att.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 0.6,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.paper",
            minWidth: 220,
          }}
        >
          <Box sx={{ color: "primary.main", display: "flex" }}>{attachmentIcon(att.type)}</Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{att.name}</Typography>
            <Typography variant="caption" color="text.secondary">{att.size}</Typography>
          </Box>
          <IconButton size="small" onClick={() => onDownload(att.id, att.name)}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
}

/* ── Status check marks ── */
function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  if (status === "sent") return <DoneIcon sx={{ fontSize: 16, color: "text.disabled" }} />;
  if (status === "delivered") return <DoneAllIcon sx={{ fontSize: 16, color: "text.disabled" }} />;
  return <DoneAllIcon sx={{ fontSize: 16, color: "primary.main" }} />;
}

/* ══════════════════════════════════════════════════════ */

export function ChatView({ onHeaderChange }: ChatViewProps = {}) {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isXl = useMediaQuery(theme.breakpoints.up("xl"));
  const { user, api } = useSession();

  // Chat participants are addressed by email, so the signed-in address is what
  // marks a message as this user's own. The fixtures used the literal "me".
  const me = user.email;

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [showGroups, setShowGroups] = useState(true);
  const [draft, setDraft] = useState("");
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [pendingImages, setPendingImages] = useState<ChatImage[]>([]);
  // The chips above are for display; these are the bytes that get uploaded.
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const conversationPaneRef = useRef<HTMLDivElement>(null);
  const [collapsedAccounts, setCollapsedAccounts] = useState<Set<string>>(new Set());
  const [mutedChats, setMutedChats] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const unreadSnapshot = useRef<Record<string, number>>({});
  const [newChatOpen, setNewChatOpen] = useState(false);
  // Delete hides the chat until the next message; leave also stops the
  // messages, which is what makes it the stronger of the two.
  const [confirmAction, setConfirmAction] = useState<"delete" | "leave" | null>(null);

  const multiPane = isMd;
  const threePane = isXl;

  // The chat list and the open conversation are two calls. Both poll, because
  // the WebSocket bridge ADR 13 describes is not implemented in the API server.
  const mailboxId = useChatMailbox();
  const { data: chatData, reload: reloadChats } = useChats(mailboxId, activeFilter);
  const chatList = chatData.chats;
  const { data: openMessages, reload: reloadMessages, append } = useChatMessages(selectedChatId);
  const [sendError, setSendError] = useState("");

  // The live connection. Messages arrive as frames and are appended; anything
  // that changes a chat's own row, like an unread count, re-reads the list.
  const socket = useChatSocket({
    openChatId: selectedChatId,
    onMessage: (chatId, message) => {
      if (chatId === selectedChatId) append(message);
      reloadChats();
    },
    onChatChanged: reloadChats,
    onError: setSendError,
  });

  // The open chat carries its messages; the rest carry none, which is all the
  // list needs beyond what the chat row itself reports.
  const chats = useMemo<Chat[]>(
    () =>
      chatList.map((chat) =>
        chat.id === selectedChatId ? { ...chat, messages: openMessages } : chat,
      ),
    [chatList, selectedChatId, openMessages],
  );

  const participantMap = chatData.participants;

  /* filtered + sorted chat list */
  const visibleChats = useMemo(() => {
    let list = [...chats];
    if (filterUnread) list = list.filter((c) => c.unreadCount > 0);
    if (!showGroups) list = list.filter((c) => !c.isGroup);
    if (activeFilter) {
      const q = activeFilter.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.messages.some((m) => m.body.toLowerCase().includes(q)),
      );
    }
    list.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    return list;
  }, [chats, filterUnread, showGroups, activeFilter]);

  const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

  /* auto-select first chat on desktop */
  useEffect(() => {
    if (multiPane && !selectedChatId && visibleChats.length > 0) {
      const chat = visibleChats[0];
      if (chat.unreadCount > 0) {
        unreadSnapshot.current[chat.id] = chat.unreadCount;
      }
      setSelectedChatId(chat.id);
    }
  }, [multiPane, selectedChatId, visibleChats]);

  /* scroll to bottom when chat changes or message sent */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages.length, selectedChatId]);

  /* Opening a chat is what clears its unread count. useChatSocket sends the
     read frame and re-reads the list once the server has acted on it, so there
     is nothing to do here. */

  const handleSelectChat = useCallback((chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat && chat.unreadCount > 0) {
      unreadSnapshot.current[chatId] = chat.unreadCount;
    } else {
      delete unreadSnapshot.current[chatId];
    }
    setSelectedChatId(chatId);
    setShowInfo(false);
  }, [chats]);

  /* Publish chat header state to the host (AppBar) */
  useEffect(() => {
    if (!onHeaderChange) return;
    /* Chat list is on screen whenever we're multi-pane or no chat is selected. */
    const chatListVisible = multiPane || !selectedChatId;
    const base = {
      showSearchButton: chatListVisible,
      searching,
      searchInput,
      onSearchStart: () => setSearching(true),
      onSearchInputChange: (v: string) => setSearchInput(v),
      onSearchCommit: () => {
        setActiveFilter(searchInput.trim());
        setSearching(false);
      },
      onSearchCancel: () => {
        setSearching(false);
        setSearchInput("");
        setActiveFilter("");
      },
    };
    if (!selectedChat) {
      onHeaderChange(base);
      return;
    }
    // Typing wins over presence: it is the more immediate fact, and it is what
    // the person on the other end is doing right now.
    const typingHere = [...socket.typists.values()].filter((t) => t.chatId === selectedChat.id);
    const subtitle = typingHere.length > 0
      ? (selectedChat.isGroup ? `${typingHere.length} typing…` : "typing…")
      : selectedChat.isGroup
        ? `${selectedChat.participants.length} participants`
        : liveStatus(selectedChat, me, participantMap, socket.presence);
    onHeaderChange({
      ...base,
      title: selectedChat.name,
      subtitle,
      onBack: !multiPane
        ? showInfo
          ? () => setShowInfo(false)
          : () => setSelectedChatId(null)
        : undefined,
      isMuted: mutedChats.has(selectedChat.id),
      onToggleMute: () =>
        setMutedChats((prev) => {
          const next = new Set(prev);
          if (next.has(selectedChat.id)) next.delete(selectedChat.id);
          else next.add(selectedChat.id);
          return next;
        }),
      onDelete: () => setConfirmAction("delete"),
      onLeave: () => setConfirmAction("leave"),
      showInfoButton: !threePane,
      onToggleInfo: () => setShowInfo((v) => !v),
    });
    return () => onHeaderChange(null);
  }, [
    onHeaderChange,
    selectedChat,
    selectedChatId,
    multiPane,
    threePane,
    showInfo,
    mutedChats,
    searching,
    searchInput,
  ]);

  const handleSend = () => {
    if (!selectedChatId) return;
    const body = draft.trim();
    // The API takes a body and attachments; it has no notion of a message that
    // is only files, and rejects an empty body.
    if (!body) return;
    const files = pendingFiles;
    setDraft("");
    setPendingAttachments([]);
    setPendingImages([]);
    setPendingFiles([]);
    setSendError("");
    // Clearing the draft does not go through onChange, so the retraction has to
    // be explicit or the other side keeps showing "typing" until the TTL.
    socket.setTyping(selectedChatId, false);

    // A message with attachments still goes over REST: the socket carries text
    // frames only, so base64 bytes have no business on it. Everything else goes
    // over the socket, which is what makes it appear for the others at once.
    if (files.length > 0) {
      void toUploads(files)
        .then((uploads) => api.addChatMessage(Number(selectedChatId), body, uploads))
        .then(
          () => {
            reloadMessages();
            reloadChats();
          },
          (err: unknown) => {
            setSendError(err instanceof Error ? err.message : "Could not send the message.");
            setDraft(body);
          },
        );
      return;
    }
    socket.sendMessage(selectedChatId, body);
  };

  // A direct chat with someone already in the list is opened rather than made
  // again: the server would happily create a second one.
  const handleCreateChat = async (participants: string[], name?: string) => {
    if (mailboxId === null) throw new Error("No mailbox to start a chat in.");
    if (!name) {
      const existing = chats.find(
        (c) => !c.isGroup && c.participants.some((p) => p.toLowerCase() === participants[0].toLowerCase()),
      );
      if (existing) {
        handleSelectChat(existing.id);
        return;
      }
    }
    const chatId = await api.addChat(mailboxId, name ? "group" : "direct", participants, name);
    if (!chatId) throw new Error("Could not start the chat.");
    reloadChats();
    handleSelectChat(String(chatId));
  };

  const handleConfirmAction = () => {
    if (!selectedChatId || !confirmAction) return;
    const chatId = Number(selectedChatId);
    const action = confirmAction;
    setConfirmAction(null);
    // Leaving is removing your own participant row, then hiding the chat as a
    // delete does, so it does not linger in the list without new messages.
    const work = action === "leave"
      ? api.chatParticipants(chatId).then((participants) => {
          const mine = participants.find((p) => p.email.toLowerCase() === me.toLowerCase());
          if (!mine) throw new Error("You are not a participant of this chat.");
          return api.removeChatParticipant(mine.participantId);
        }).then(() => api.deleteChat(chatId))
      : api.deleteChat(chatId);
    void work.then(
      () => {
        setSelectedChatId(null);
        setShowInfo(false);
        reloadChats();
      },
      (err: unknown) =>
        setSendError(err instanceof Error ? err.message : `Could not ${action} the chat.`),
    );
  };

  // Bytes come back base64 in JSON rather than from a URL, so the download is
  // assembled here.
  const handleDownloadAttachment = useCallback(
    (id: string, name: string) => {
      void api.chatAttachment(Number(id)).then(
        (file) => {
          const url = toBlobUrl(file.fileData, file.mimeType);
          const link = document.createElement("a");
          link.href = url;
          link.download = name;
          link.click();
          URL.revokeObjectURL(url);
        },
        (err: unknown) =>
          setSendError(err instanceof Error ? err.message : "Could not download the file."),
      );
    },
    [api],
  );

  const handleAttachFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files);
    const next: ChatAttachment[] = picked.map((f) => ({
      id: `att-new-${Date.now()}-${f.name}`,
      name: f.name,
      size: formatBytes(f.size),
      type: f.type || "application/octet-stream",
    }));
    setPendingAttachments((prev) => [...prev, ...next]);
    setPendingFiles((prev) => [...prev, ...picked]);
  };

  const handleAttachImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files);
    const next: ChatImage[] = picked.map((f) => ({
      id: `img-new-${Date.now()}-${f.name}`,
      url: URL.createObjectURL(f),
    }));
    setPendingImages((prev) => [...prev, ...next]);
    setPendingFiles((prev) => [...prev, ...picked]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleAccount = (email: string) => {
    setCollapsedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  /* Group chats by account, preserving the sort order within each group */
  const chatsByAccount = useMemo(() => {
    const map = new Map<string, Chat[]>();
    for (const chat of visibleChats) {
      if (!map.has(chat.accountEmail)) map.set(chat.accountEmail, []);
      map.get(chat.accountEmail)!.push(chat);
    }
    // Only surface accounts that actually own chats matching current filters
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [visibleChats]);

  /* ── Chat list pane ── */
  const chatListPane = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.paper" }}>
      {/* Filters */}
      <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "divider", flexWrap: "wrap" }}>
        <Chip
          label="Unread"
          size="small"
          color={filterUnread ? "primary" : "default"}
          variant={filterUnread ? "filled" : "outlined"}
          onClick={() => setFilterUnread((v) => !v)}
        />
        <Chip
          label="1 on 1"
          size="small"
          color={!showGroups ? "primary" : "default"}
          variant={!showGroups ? "filled" : "outlined"}
          onClick={() => setShowGroups((v) => !v)}
        />
        <Tooltip title="New chat">
          <IconButton
            size="small"
            aria-label="new chat"
            onClick={() => setNewChatOpen(true)}
            disabled={mailboxId === null}
            sx={{ ml: "auto" }}
          >
            <AddCommentIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {activeFilter && (
        <Alert
          severity="warning"
          sx={{ borderRadius: 0 }}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => { setActiveFilter(""); setSearchInput(""); }}
              aria-label="clear filter"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          Showing results for &lsquo;{activeFilter}&rsquo;
        </Alert>
      )}

      {/* Chat list — grouped by account */}
      <List sx={{ flexGrow: 1, overflow: "auto", py: 0 }}>
        {chatsByAccount.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            <Typography variant="body2">No chats found</Typography>
          </Box>
        )}
        {chatsByAccount.map(([email, list]) => {
          const collapsed = collapsedAccounts.has(email);
          const unread = list.reduce((n, c) => n + (c.unreadCount > 0 ? 1 : 0), 0);
          return (
            <Box key={email}>
              <ListItemButton
                onClick={() => toggleAccount(email)}
                sx={{
                  py: 0.6,
                  px: 2,
                  bgcolor: "grey.100",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "grey.200" },
                }}
              >
                {collapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                <Typography variant="subtitle2" noWrap sx={{ ml: 0.5, flexGrow: 1, fontWeight: 600 }}>
                  {email}
                </Typography>
                {collapsed && unread > 0 && (
                  <Badge badgeContent={unread} color="primary" sx={{ mr: 1.2 }} />
                )}
              </ListItemButton>
              {!collapsed && list.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                const senderName = lastMsg?.fromId === me ? "You" : (participantMap.get(lastMsg?.fromId)?.name.split(" ")[0] ?? "");
                const selected = chat.id === selectedChatId;
                return (
                  <ListItemButton
                    key={chat.id}
                    selected={selected}
                    onClick={() => handleSelectChat(chat.id)}
                    sx={{
                      py: 1.2,
                      px: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <ListItemAvatar>
                      {(() => {
                        const otherParticipant = !chat.isGroup ? participantMap.get(chat.participants.find((p) => p !== me) ?? "") : undefined;
                        const isOnline = otherParticipant?.status === "online";
                        return isOnline ? (
                          <Badge
                            variant="dot"
                            overlap="circular"
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            sx={{ "& .MuiBadge-dot": { bgcolor: "success.main", width: 12, height: 12, borderRadius: "50%", border: "2px solid white" } }}
                          >
                            <Avatar sx={{ bgcolor: avatarColor(chat.name), width: 48, height: 48 }}>
                              {getInitials(chat.name)}
                            </Avatar>
                          </Badge>
                        ) : (
                          <Avatar sx={{ bgcolor: avatarColor(chat.name), width: 48, height: 48 }}>
                            {chat.isGroup ? <GroupIcon /> : getInitials(chat.name)}
                          </Avatar>
                        );
                      })()}
                    </ListItemAvatar>
                    <ListItemText
                      sx={{ ml: 0.5 }}
                      primary={
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", lineHeight: 1.6 }}>
                          <Typography
                            variant="body1"
                            noWrap
                            sx={{ flexGrow: 1, mr: 1 }}
                          >
                            {chat.name}
                          </Typography>
                          <Typography variant="caption" color={chat.unreadCount > 0 ? "primary" : "text.secondary"} sx={{ whiteSpace: "nowrap", fontWeight: chat.unreadCount > 0 ? 700 : 400 }}>
                            {formatTime(chat.lastActivity)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: "flex", alignItems: "center", lineHeight: 1.6 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            color="text.secondary"
                            sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
                            component="span"
                          >
                            {lastMsg && (() => {
                              const preview = lastMsg.body
                                || (lastMsg.images?.length ? `📷 ${lastMsg.images.length} photo${lastMsg.images.length > 1 ? "s" : ""}` : "")
                                || (lastMsg.attachments?.length ? `📎 ${lastMsg.attachments[0].name}` : "");
                              return (
                                <>
                                  {lastMsg.fromId === me && <StatusIcon status={lastMsg.status} />}
                                  {" "}
                                  {chat.isGroup && `${senderName}: `}
                                  {preview}
                                </>
                              );
                            })()}
                          </Typography>
                          {mutedChats.has(chat.id) && (
                            <VolumeOffIcon sx={{ ml: 1, color: "text.secondary", fontSize: 18, flexShrink: 0 }} />
                          )}
                          {chat.unreadCount > 0 && (
                            <Badge badgeContent={chat.unreadCount} color="primary" sx={{ ml: 1.5, mr: 1.2, flexShrink: 0 }} />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </Box>
          );
        })}
      </List>
    </Box>
  );

  /* ── Conversation pane ── */
  const conversationPane = selectedChat ? (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "grey.100" }}>
      {sendError && (
        <Alert severity="error" onClose={() => setSendError("")} sx={{ borderRadius: 0 }}>
          {sendError}
        </Alert>
      )}

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: "auto", px: { xs: 1, sm: 1.5 }, py: 1 }}>
        {(() => {
          const snap = unreadSnapshot.current[selectedChat.id] ?? 0;
          const unreadStart = snap > 0 ? selectedChat.messages.length - snap : -1;
          return selectedChat.messages.map((msg, i) => {
          const isOwn = msg.fromId === me;
          const sender = participantMap.get(msg.fromId);
          const showSender = selectedChat.isGroup && !isOwn;
          const showDate = shouldShowDateSeparator(selectedChat.messages[i - 1], msg);
          const nextMsg = selectedChat.messages[i + 1];
          const nextShowDate = nextMsg ? shouldShowDateSeparator(msg, nextMsg) : false;
          const isSameSenderNext = nextMsg && !nextShowDate && nextMsg.fromId === msg.fromId;
          const spacing = isSameSenderNext ? 0.25 : 1.5;
          return (
            <Box key={msg.id}>
              {i === unreadStart && (
                <Box sx={{ display: "flex", alignItems: "center", my: 1.5, gap: 1.5 }}>
                  <Divider sx={{ flex: 1, borderColor: "primary.main" }} />
                  <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600, whiteSpace: "nowrap" }}>
                    New messages
                  </Typography>
                  <Divider sx={{ flex: 1, borderColor: "primary.main" }} />
                </Box>
              )}
              {showDate && (
                <Box sx={{ textAlign: "center", my: 1.5 }}>
                  <Chip label={formatDateLabel(msg.timestamp)} size="small" sx={{ bgcolor: "background.paper", fontSize: 12 }} />
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", mb: spacing }}>
                <Paper
                  variant="outlined"
                  sx={{
                    px: 3,
                    py: 0.8,
                    maxWidth: { xs: "85%", md: "65%" },
                    bgcolor: isOwn ? alpha(theme.palette.primary.main, 0.08) : "background.paper",
                    borderRadius: 2,
                    borderTopLeftRadius: isOwn ? 8 : 0,
                    borderTopRightRadius: isOwn ? 0 : 8,
                    position: "relative",
                  }}
                >
                  {showSender && (
                    <Typography variant="caption" sx={{ fontWeight: 700, color: avatarColor(sender?.name ?? ""), display: "block", mb: 0.2 }}>
                      {sender?.name}
                    </Typography>
                  )}
                  {msg.body && (
                    isEmojiOnly(msg.body) ? (
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "2.5rem", lineHeight: 1 }}>
                        {msg.body}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", "& .inline-emoji": { fontSize: "1.1rem", verticalAlign: "-0.05em", lineHeight: 0 } }}>
                        {msg.body.split(/(\p{Emoji_Presentation}\ufe0f?|\p{Extended_Pictographic}\ufe0f?)/u).map((part, i) =>
                          /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\ufe0f?$/u.test(part)
                            ? <span key={i} className="inline-emoji">{part}</span>
                            : part
                        )}
                      </Typography>
                    )
                  )}
                  {msg.images && msg.images.length > 0 && (
                    <ImageGrid images={msg.images} onOpen={setLightbox} />
                  )}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <AttachmentList attachments={msg.attachments} onDownload={handleDownloadAttachment} />
                  )}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.3, mt: 0.3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                      {formatMessageTime(msg.timestamp)}
                    </Typography>
                    {isOwn && <StatusIcon status={msg.status} />}
                  </Box>
                </Paper>
              </Box>
            </Box>
          );
        });
        })()}
        <div ref={messagesEnd} />
      </Box>

      {/* Pending attachments / images preview */}
      {(pendingAttachments.length > 0 || pendingImages.length > 0) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, px: 1.5, py: 1, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider" }}>
          {pendingImages.map((img, idx) => (
            <Box key={img.id} sx={{ position: "relative" }}>
              <Box
                component="img"
                src={img.url}
                sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1, display: "block" }}
              />
              <IconButton
                size="small"
                onClick={() => setPendingImages((p) => p.filter((_, i) => i !== idx))}
                sx={{ position: "absolute", top: -8, right: -8, bgcolor: "background.paper", boxShadow: 1, "&:hover": { bgcolor: "background.paper" } }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
          {pendingAttachments.map((att, idx) => (
            <Chip
              key={att.id}
              icon={attachmentIcon(att.type)}
              label={`${att.name} (${att.size})`}
              onDelete={() => setPendingAttachments((p) => p.filter((_, i) => i !== idx))}
            />
          ))}
        </Box>
      )}

      {/* Compose bar */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, p: 1, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider" }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => { handleAttachFiles(e.target.files); e.target.value = ""; }}
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          hidden
          accept="image/*"
          onChange={(e) => { handleAttachImages(e.target.files); e.target.value = ""; }}
        />
        <IconButton size="small" onClick={() => fileInputRef.current?.click()} aria-label="Attach file">
          <AttachFileIcon />
        </IconButton>
        <IconButton size="small" onClick={() => imageInputRef.current?.click()} aria-label="Attach image">
          <ImageIcon />
        </IconButton>
        <IconButton size="small" onClick={(e) => setEmojiAnchor(e.currentTarget)}>
          <EmojiEmotionsIcon />
        </IconButton>
        <Popover
          open={Boolean(emojiAnchor)}
          anchorEl={emojiAnchor}
          onClose={() => setEmojiAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", p: 1, gap: 0.3 }}>
            {EMOJI_PICKS.map((em) => (
              <Box
                key={em}
                onClick={() => { setDraft((d) => d + em); setEmojiAnchor(null); }}
                sx={{ cursor: "pointer", fontSize: 22, textAlign: "center", p: 0.4, borderRadius: 1, "&:hover": { bgcolor: "action.hover" } }}
              >
                {em}
              </Box>
            ))}
          </Box>
        </Popover>
        <InputBase
          placeholder="Type a message"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (selectedChatId) socket.setTyping(selectedChatId, e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          multiline
          maxRows={4}
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            borderRadius: 3,
            px: 2,
            py: 0.8,
            fontSize: 14,
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!draft.trim() && pendingAttachments.length === 0 && pendingImages.length === 0}
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* Lightbox */}
      {lightbox && (
        <Box
          onClick={() => setLightbox(null)}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.85)",
            zIndex: (t) => t.zIndex.modal + 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <IconButton
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            sx={{ position: "absolute", top: 16, right: 16, color: "common.white" }}
          >
            <CloseIcon />
          </IconButton>
          <Box component="img" src={lightbox} sx={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain" }} />
        </Box>
      )}
    </Box>
  ) : (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", bgcolor: "grey.100", color: "text.secondary" }}>
      <Box sx={{ textAlign: "center" }}>
        <PersonIcon sx={{ fontSize: 64, mb: 1, opacity: 0.4 }} />
        <Typography>Select a chat to start messaging</Typography>
      </Box>
    </Box>
  );

  /* ── Info / profile panel (third pane) ── */
  const infoPane = selectedChat ? (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.paper", borderLeft: "1px solid", borderColor: "divider", overflow: "auto" }}>
      {/* Avatar + name */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3, gap: 1 }}>
        <Avatar sx={{ bgcolor: avatarColor(selectedChat.name), width: 80, height: 80, fontSize: 32 }}>
          {selectedChat.isGroup ? <GroupIcon sx={{ fontSize: 40 }} /> : getInitials(selectedChat.name)}
        </Avatar>
        <Typography variant="h6">{selectedChat.name}</Typography>
        {selectedChat.description && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, textAlign: "center" }}>
            {selectedChat.description}
          </Typography>
        )}
        {!selectedChat.isGroup && (() => {
          const other = participantMap.get(selectedChat.participants.find((p) => p !== me) ?? "");
          return other ? (
            <>
              <Typography variant="body2" color="text.secondary">{other.email}</Typography>
              <Chip
                size="small"
                label={other.status}
                color={other.status === "online" ? "success" : "default"}
                variant="outlined"
              />
            </>
          ) : null;
        })()}
      </Box>

      <Divider />

      {/* Participants (group) */}
      {selectedChat.isGroup && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {selectedChat.participants.length} participants
          </Typography>
          <List dense sx={{ py: 0 }}>
            {selectedChat.participants.map((pid) => {
              const p = participantMap.get(pid);
              if (!p) return null;
              return (
                <ListItemButton key={pid} sx={{ borderRadius: 1, px: 1 }}>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ bgcolor: avatarColor(p.name), width: 32, height: 32, fontSize: 13 }}>
                      {getInitials(p.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={p.id === me ? "You" : p.name}
                    secondary={p.status}
                    slotProps={{
                      primary: { variant: "body2", sx: { fontWeight: p.id === me ? 600 : 400 } },
                      secondary: { variant: "caption" },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}

      <Divider />
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", px: 1, py: 1 }}>
        <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setConfirmAction("delete")}>
          Delete chat
        </Button>
        <Button color="error" startIcon={<LogoutIcon />} onClick={() => setConfirmAction("leave")}>
          Leave chat
        </Button>
      </Box>
    </Box>
  ) : null;

  const dialogs = (
    <>
      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} onCreate={handleCreateChat} />
      <Dialog open={confirmAction !== null} onClose={() => setConfirmAction(null)}>
        <DialogTitle>
          {confirmAction === "leave" ? "Leave" : "Delete"} {selectedChat ? `"${selectedChat.name}"` : "chat"}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === "leave"
              ? "You will stop receiving messages in this chat and it is removed from your list. The others see that you left."
              : "The chat is removed from your list. You stay a participant, so it comes back with its history when someone sends a new message."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmAction}>
            {confirmAction === "leave" ? "Leave chat" : "Delete chat"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  /* ── Layout assembly ── */

  // Mobile: single pane switching
  if (!multiPane) {
    if (selectedChatId && showInfo && selectedChat) {
      return <Box sx={{ height: "100%", overflow: "auto" }}>{infoPane}{dialogs}</Box>;
    }
    if (selectedChatId) {
      return <Box sx={{ height: "100%" }}>{conversationPane}{dialogs}</Box>;
    }
    return <Box sx={{ height: "100%" }}>{chatListPane}{dialogs}</Box>;
  }

  // Desktop: two or three pane
  return (
    <Box sx={{ display: "flex", height: "100%", width: "100%" }}>
      {/* Chat list */}
      <Box
        sx={{
          width: "30%",
          minWidth: 360,
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {chatListPane}
      </Box>

      {/* Conversation */}
      <Box ref={conversationPaneRef} sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden", position: "relative" }}>
        {conversationPane}
        {selectedChat && !threePane && (
          <Drawer
            anchor="right"
            variant="temporary"
            open={showInfo}
            onClose={() => setShowInfo(false)}
            ModalProps={{ container: conversationPaneRef.current, keepMounted: false, disableScrollLock: true, disableAutoFocus: true, disableEnforceFocus: true, disableRestoreFocus: true }}
            sx={{
              position: "absolute",
              "& .MuiBackdrop-root": { position: "absolute" },
              "& .MuiDrawer-paper": { position: "absolute", width: 300 },
            }}
          >
            {infoPane}
          </Drawer>
        )}
      </Box>

      {/* Info panel — inline on desktop */}
      {selectedChat && threePane && (
        <Box sx={{ width: 300, flexShrink: 0, overflow: "auto" }}>
          {infoPane}
        </Box>
      )}
      {dialogs}
    </Box>
  );
}
