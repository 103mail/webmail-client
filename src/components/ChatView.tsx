import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import type { Chat, ChatMessage } from "../types";
import { sampleChats, participantMap, ownUser } from "../data/chats";
import { accounts } from "../data/accounts";

/* ── Constants ── */
const CHAT_LIST_WIDTH = 360;
const INFO_PANEL_WIDTH = 300;

const EMOJI_PICKS = [
  "😀","😂","😍","🥰","😎","🤔","👍","👎","🙌","🎉",
  "❤️","🔥","💯","😢","😡","🤣","😊","🥳","🤩","😇",
  "👋","✅","💪","🙏","😬","🤷","💜","🚀","🎨","☕",
];

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
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return time;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

/* ── Status check marks ── */
function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  if (status === "sent") return <DoneIcon sx={{ fontSize: 16, color: "text.disabled" }} />;
  if (status === "delivered") return <DoneAllIcon sx={{ fontSize: 16, color: "text.disabled" }} />;
  return <DoneAllIcon sx={{ fontSize: 16, color: "#53bdeb" }} />;
}

/* ══════════════════════════════════════════════════════ */

export function ChatView() {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isXl = useMediaQuery(theme.breakpoints.up("xl"));

  const [chats, setChats] = useState<Chat[]>(sampleChats);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [showGroups, setShowGroups] = useState(true);
  const [draft, setDraft] = useState("");
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [activeAccount, setActiveAccount] = useState(accounts[0]);
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const multiPane = isMd;
  const threePane = isXl;

  /* filtered + sorted chat list */
  const visibleChats = useMemo(() => {
    let list = [...chats];
    if (filterUnread) list = list.filter((c) => c.unreadCount > 0);
    if (!showGroups) list = list.filter((c) => !c.isGroup);
    list.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    return list;
  }, [chats, filterUnread, showGroups]);

  const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

  /* auto-select first chat on desktop */
  useEffect(() => {
    if (multiPane && !selectedChatId && visibleChats.length > 0) {
      setSelectedChatId(visibleChats[0].id);
    }
  }, [multiPane, selectedChatId, visibleChats]);

  /* scroll to bottom when chat changes or message sent */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages.length, selectedChatId]);

  /* mark messages read when opening */
  useEffect(() => {
    if (!selectedChat || selectedChat.unreadCount === 0) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat.id
          ? { ...c, unreadCount: 0, messages: c.messages.map((m) => ({ ...m, status: "read" as const })) }
          : c,
      ),
    );
  }, [selectedChatId]);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    setShowInfo(false);
  }, []);

  const handleSend = () => {
    if (!draft.trim() || !selectedChatId) return;
    const now = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `msg-new-${Date.now()}`,
      chatId: selectedChatId,
      fromId: "me",
      body: draft.trim(),
      timestamp: now,
      status: "sent",
    };
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChatId
          ? { ...c, messages: [...c.messages, newMsg], lastActivity: now }
          : c,
      ),
    );
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Chat list pane ── */
  const chatListPane = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.paper" }}>
      {/* Header: own profile */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
              {ownUser.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {activeAccount.email}
            </Typography>
          </Box>
          <Tooltip title="Switch account">
            <IconButton size="small" onClick={(e) => setAccountAnchor(e.currentTarget)} aria-label="switch account">
              <SwapHorizIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Menu
        anchorEl={accountAnchor}
        open={Boolean(accountAnchor)}
        onClose={() => setAccountAnchor(null)}
      >
        {accounts.map((acc) => (
          <MenuItem
            key={acc.email}
            selected={acc.email === activeAccount.email}
            onClick={() => { setActiveAccount(acc); setAccountAnchor(null); }}
          >
            {acc.email}
          </MenuItem>
        ))}
      </Menu>

      {/* Filters */}
      <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "divider" }}>
        <Chip
          label="Unread"
          size="small"
          color={filterUnread ? "primary" : "default"}
          variant={filterUnread ? "filled" : "outlined"}
          onClick={() => setFilterUnread((v) => !v)}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
          <GroupIcon sx={{ fontSize: 18, color: showGroups ? "primary.main" : "text.disabled" }} />
          <Switch size="small" checked={showGroups} onChange={(_, v) => setShowGroups(v)} />
        </Box>
      </Box>

      {/* Chat list */}
      <List sx={{ flexGrow: 1, overflow: "auto", py: 0 }}>
        {visibleChats.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            <Typography variant="body2">No chats found</Typography>
          </Box>
        )}
        {visibleChats.map((chat) => {
          const lastMsg = chat.messages[chat.messages.length - 1];
          const senderName = lastMsg?.fromId === "me" ? "You" : (participantMap.get(lastMsg?.fromId)?.name.split(" ")[0] ?? "");
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
                "&.Mui-selected": { bgcolor: "action.selected" },
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={chat.unreadCount}
                  color="primary"
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                >
                  <Avatar sx={{ bgcolor: avatarColor(chat.name), width: 48, height: 48 }}>
                    {chat.isGroup ? <GroupIcon /> : getInitials(chat.name)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                sx={{ ml: 0.5 }}
                primary={
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography
                      variant="body1"
                      noWrap
                      sx={{ flexGrow: 1, mr: 1, fontWeight: chat.unreadCount > 0 ? 700 : 400 }}
                    >
                      {chat.name}
                    </Typography>
                    <Typography variant="caption" color={chat.unreadCount > 0 ? "primary" : "text.secondary"} sx={{ whiteSpace: "nowrap" }}>
                      {formatTime(chat.lastActivity)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="body2"
                    noWrap
                    color={chat.unreadCount > 0 ? "text.primary" : "text.secondary"}
                    sx={{ fontWeight: chat.unreadCount > 0 ? 600 : 400 }}
                    component="span"
                  >
                    {lastMsg && (
                      <>
                        {lastMsg.fromId === "me" && <StatusIcon status={lastMsg.status} />}
                        {" "}
                        {chat.isGroup && `${senderName}: `}
                        {lastMsg.body}
                      </>
                    )}
                  </Typography>
                }
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  /* ── Conversation pane ── */
  const conversationPane = selectedChat ? (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#efeae2" }}>
      {/* Conversation header */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {!multiPane && (
          <IconButton size="small" onClick={() => setSelectedChatId(null)}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Avatar sx={{ bgcolor: avatarColor(selectedChat.name), width: 40, height: 40 }}>
          {selectedChat.isGroup ? <GroupIcon /> : getInitials(selectedChat.name)}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
            {selectedChat.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {selectedChat.isGroup
              ? `${selectedChat.participants.length} participants`
              : participantMap.get(selectedChat.participants.find((p) => p !== "me") ?? "")?.status ?? ""}
          </Typography>
        </Box>
        {!threePane && !showInfo && (
          <Tooltip title="Info">
            <IconButton size="small" onClick={() => setShowInfo(true)}>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: "auto", px: { xs: 1, md: 3 }, py: 1 }}>
        {selectedChat.messages.map((msg, i) => {
          const isOwn = msg.fromId === "me";
          const sender = participantMap.get(msg.fromId);
          const showSender = selectedChat.isGroup && !isOwn;
          const showDate = shouldShowDateSeparator(selectedChat.messages[i - 1], msg);
          return (
            <Box key={msg.id}>
              {showDate && (
                <Box sx={{ textAlign: "center", my: 1.5 }}>
                  <Chip label={formatDateLabel(msg.timestamp)} size="small" sx={{ bgcolor: "rgba(255,255,255,0.9)", fontSize: 12 }} />
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", mb: 0.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    maxWidth: { xs: "85%", md: "65%" },
                    bgcolor: isOwn ? "#d9fdd3" : "#ffffff",
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
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {msg.body}
                  </Typography>
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
        })}
        <div ref={messagesEnd} />
      </Box>

      {/* Compose bar */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, p: 1, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider" }}>
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
          onChange={(e) => setDraft(e.target.value)}
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
        <IconButton color="primary" onClick={handleSend} disabled={!draft.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  ) : (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", bgcolor: "#efeae2", color: "text.secondary" }}>
      <Box sx={{ textAlign: "center" }}>
        <PersonIcon sx={{ fontSize: 64, mb: 1, opacity: 0.4 }} />
        <Typography>Select a chat to start messaging</Typography>
      </Box>
    </Box>
  );

  /* ── Info / profile panel (third pane) ── */
  const infoPane = selectedChat ? (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.paper", borderLeft: "1px solid", borderColor: "divider" }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {selectedChat.isGroup ? "Group info" : "Contact info"}
        </Typography>
        {!threePane && (
          <IconButton size="small" onClick={() => setShowInfo(false)}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

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
          const other = participantMap.get(selectedChat.participants.find((p) => p !== "me") ?? "");
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
                    primary={p.id === "me" ? "You" : p.name}
                    secondary={p.status}
                    slotProps={{
                      primary: { variant: "body2", sx: { fontWeight: p.id === "me" ? 600 : 400 } },
                      secondary: { variant: "caption" },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  ) : null;

  /* ── Layout assembly ── */

  // Mobile: single pane switching
  if (!multiPane) {
    if (selectedChatId && showInfo && selectedChat) {
      return <Box sx={{ height: "100%", overflow: "auto" }}>{infoPane}</Box>;
    }
    if (selectedChatId) {
      return <Box sx={{ height: "100%" }}>{conversationPane}</Box>;
    }
    return <Box sx={{ height: "100%" }}>{chatListPane}</Box>;
  }

  // Desktop: two or three pane
  return (
    <Box sx={{ display: "flex", height: "100%", width: "100%" }}>
      {/* Chat list */}
      <Box
        sx={{
          width: CHAT_LIST_WIDTH,
          minWidth: 280,
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {chatListPane}
      </Box>

      {/* Conversation — shrinks when info pane is visible */}
      <Box sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
        {conversationPane}
      </Box>

      {/* Info panel — always visible on xl, toggled inline on md */}
      {selectedChat && (threePane || showInfo) && (
        <Box sx={{ width: INFO_PANEL_WIDTH, flexShrink: 0, overflow: "auto" }}>
          {infoPane}
        </Box>
      )}
    </Box>
  );
}
