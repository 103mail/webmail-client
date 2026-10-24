import { useState, useCallback, useEffect } from "react";
import {
  AppBar,
  Box,
  Drawer,
  Fab,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import EditIcon from "@mui/icons-material/Edit";
import ReplyIcon from "@mui/icons-material/Reply";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import { SectionNav } from "./components/SectionNav";
import type { Section } from "./components/SectionNav";
import { Sidebar } from "./components/Sidebar";
import { ComposeScreen } from "./components/ComposeScreen";
import { MailList } from "./components/MailList";
import { ThreadDetail } from "./components/ThreadDetail";
import { CalendarView } from "./components/CalendarView";
import type { CalendarHeaderState } from "./components/CalendarView";
import { ChatView } from "./components/ChatView";
import type { ChatHeaderState } from "./components/ChatView";
import { AccountScreen } from "./components/AccountScreen";
import type { AccountProfile } from "./components/AccountScreen";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import type { MailThread } from "./types";
import { useAuth, useSession } from "./auth/AuthContext";
import { useAccounts, useThreads, useThreadMessages } from "./api/hooks";

const DRAWER_WIDTH = 280;
const RAIL_WIDTH = 60;
const THREAD_LIST_WIDTH = 360;

type MailView = "list" | "thread" | "compose";
type Layout = "mobile" | "medium" | "large";

export function App() {
  const [section, setSection] = useState<Section>("mail");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<MailThread | null>(null);
  const [mailView, setMailView] = useState<MailView>("list");
  const [replyRequested, setReplyRequested] = useState(0);
  const [forwardRequested, setForwardRequested] = useState(0);
  const [hasPaneOpen, setHasPaneOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [moveAnchor, setMoveAnchor] = useState<null | HTMLElement>(null);
  const [chatHeader, setChatHeader] = useState<ChatHeaderState | null>(null);
  const [calendarHeader, setCalendarHeader] = useState<CalendarHeaderState | null>(null);
  const [calViewAnchor, setCalViewAnchor] = useState<null | HTMLElement>(null);
  const [chatListMenuAnchor, setChatListMenuAnchor] = useState<null | HTMLElement>(null);
  const [chatMenuAnchor, setChatMenuAnchor] = useState<null | HTMLElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const { user, api } = useSession();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<AccountProfile>({
    fullName: user.name,
    notificationEmail: user.email,
    verifiedNotificationEmail: user.email,
    notificationFrequency: "daily",
    avatarDataUrl: undefined,
  });
  const handleOpenAccount = useCallback(() => {
    setAccountOpen(true);
    setMobileOpen(false);
  }, []);
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isXl = useMediaQuery(theme.breakpoints.up("xl"));

  const layout: Layout = isXl ? "large" : isMd ? "medium" : "mobile";
  const multiPane = layout !== "mobile";
  const selectionMode = checkedIds.size > 0;

  // Mailboxes and their folders, then the threads in the selected folder, then
  // that thread's messages. Three levels, three requests: the API has no call
  // that returns a folder's threads with their bodies.
  const { data: mailboxes, reload: reloadMailboxes } = useAccounts();
  const accounts = mailboxes.accounts;
  const { data: folderThreads, loading: threadsLoading, error: threadsError, reload: reloadThreads } =
    useThreads(selectedFolder, activeFilter);
  const { thread: openThread } = useThreadMessages(selectedThread);

  // The first folder to show is whichever the server calls default; there is no
  // folder to select until the mailboxes have been read.
  useEffect(() => {
    if (selectedFolder === null && mailboxes.defaultFolderId !== null) {
      setSelectedFolder(mailboxes.defaultFolderId);
    }
  }, [selectedFolder, mailboxes.defaultFolderId]);

  const currentAccount = accounts.find((a) => a.folders.some((f) => f.id === selectedFolder));
  const currentFolder = currentAccount?.folders.find((f) => f.id === selectedFolder);
  const canMove = (currentAccount?.folders.length ?? 0) > 1;

  // Unread counts live on the folder, so anything that changes read state or
  // moves a thread has to refresh both lists.
  const refresh = useCallback(() => {
    reloadThreads();
    reloadMailboxes();
  }, [reloadThreads, reloadMailboxes]);

  // Auto-select first thread in multi-pane mode (only when no active filter)
  useEffect(() => {
    if (!multiPane || activeFilter) return;
    if (folderThreads.length > 0 && !selectedThread) {
      setSelectedThread(folderThreads[0]);
      setMailView("thread");
    } else if (folderThreads.length === 0) {
      setSelectedThread(null);
      setMailView("list");
    }
  }, [multiPane, folderThreads, selectedThread, activeFilter]);

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    setCheckedIds(new Set());
    // The threads of the new folder are still loading, so nothing can be
    // selected yet. The auto-select effect below picks the first one once they
    // arrive, which is the same thing it does on first render.
    setSelectedThread(null);
    setMailView("list");
    if (layout !== "large") setMobileOpen(false);
  };

  const handleSelectThread = (thread: MailThread) => {
    setSelectedThread(thread);
    setMailView("thread");
    if (!multiPane) {
      history.pushState({ mailView: "thread", threadId: thread.id }, "");
    }
  };

  const handleBackToList = () => {
    setSelectedThread(null);
    setMailView("list");
    history.back();
  };

  const handleOpenCompose = () => {
    setMailView("compose");
    if (!multiPane) {
      history.pushState({ mailView: "compose" }, "");
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setMailView((current) => {
        if (current === "compose" || current === "thread") {
          setSelectedThread(null);
          return "list";
        }
        return current;
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleToggleChecked = useCallback((threadId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  }, []);

  const handleClearSelection = () => setCheckedIds(new Set());

  // Deleting removes this user's projection of the thread. The canonical
  // g_thread and its messages are append-only and stay (ADR 5).
  const handleDeleteThreads = useCallback(async (ids: string[]) => {
    await Promise.all(ids.map((id) => api.deleteThread(Number(id))));
    if (selectedThread && ids.includes(selectedThread.id)) {
      setSelectedThread(null);
      setMailView("list");
    }
    setCheckedIds(new Set());
    refresh();
  }, [api, selectedThread, refresh]);

  const handleMoveThreads = useCallback(async (ids: string[], folderId: string) => {
    await Promise.all(ids.map((id) => api.moveThread(Number(id), Number(folderId))));
    if (selectedThread && ids.includes(selectedThread.id)) {
      setSelectedThread(null);
      setMailView("list");
    }
    setCheckedIds(new Set());
    setMoveAnchor(null);
    refresh();
  }, [api, selectedThread, refresh]);

  const handleSectionChange = (s: Section) => {
    setSection(s);
    setCheckedIds(new Set());
  };

  const title =
    section === "calendar"
      ? calendarHeader?.title ?? "Calendar"
      : section === "chat"
        ? chatHeader?.title ?? "Chat"
        : mailView === "compose" && !multiPane
          ? "Compose"
          : mailView === "thread" && !multiPane
            ? ""
            : currentFolder?.name ?? "Inbox";

  const mailSubtitle =
    section === "mail" &&
    layout !== "large" &&
    mailView !== "compose" &&
    !(layout === "mobile" && mailView === "thread") &&
    currentAccount
      ? currentAccount.email
      : null;

  const sidebarDesktop = (
    <Sidebar
      accounts={accounts}
      selectedFolder={selectedFolder}
      onSelectFolder={handleSelectFolder}
    />
  );

  const sidebarMobile = (
    <Sidebar
      accounts={accounts}
      selectedFolder={selectedFolder}
      onSelectFolder={handleSelectFolder}
      showSettingsAccount
      onAccountClick={handleOpenAccount}
    />
  );

  const handleFilteredChange = useCallback((filtered: MailThread[]) => {
    if (!multiPane) return;
    if (filtered.length > 0 && activeFilter) {
      setSelectedThread(filtered[0]);
      setMailView("thread");
    } else if (filtered.length === 0) {
      setSelectedThread(null);
      setMailView("list");
    }
  }, [multiPane, activeFilter]);

  const hideAppBar = false;
  const showMailToolbar = section === "mail";
  const showChatBack = section === "chat" && Boolean(chatHeader?.onBack);
  const showBackArrow = showChatBack || (showMailToolbar && mailView === "thread" && !multiPane);
  const showHamburger = !showBackArrow && layout !== "large" && (section === "mail" || section === "calendar");
  const showLogo = !showBackArrow && !showHamburger && !(section === "chat" && layout === "mobile" && !chatHeader?.title);
  const showSearchBar = showMailToolbar && (multiPane || mailView === "list");
  const showThreadActions = showMailToolbar && selectedThread && (multiPane ? mailView === "thread" : mailView === "thread");
  const showChatConvoActions = section === "chat" && chatHeader?.onToggleMute !== undefined;
  const showChatSearchBar = section === "chat" && Boolean(chatHeader?.showSearchButton);
  const chatSearching = showChatSearchBar && Boolean(chatHeader?.searching);
  const showChatListMenu = section === "chat" && layout === "mobile" && !chatHeader?.title && !chatSearching;

  const mailList = (
    <MailList
      threads={folderThreads}
      loading={threadsLoading}
      error={threadsError}
      onSelect={handleSelectThread}
      selectedId={selectedThread?.id ?? null}
      searchQuery={activeFilter}
      onClearSearch={() => { setActiveFilter(""); setSearchInput(""); }}
      checkedIds={checkedIds}
      onToggleChecked={handleToggleChecked}
      onFilteredChange={handleFilteredChange}
    />
  );

  const rightPane = (
    <>
      {mailView === "compose" && selectedFolder && (
        <ComposeScreen
          folderId={selectedFolder}
          onSent={() => {
            setMailView("list");
            refresh();
          }}
          onDiscard={() => {
            if (multiPane && selectedThread) {
              setMailView("thread");
            } else {
              setMailView("list");
            }
          }}
        />
      )}
      {mailView === "thread" && openThread && (
        <ThreadDetail
          thread={openThread}
          replyRequested={replyRequested}
          forwardRequested={forwardRequested}
          onPaneChange={setHasPaneOpen}
          onSent={() => {
            // A reply is a new message on the same thread, so the thread has to
            // be re-read rather than patched in place.
            setSelectedThread(null);
            refresh();
          }}
        />
      )}
      {multiPane && !selectedThread && mailView !== "compose" && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "text.secondary" }}>
          <Box sx={{ textAlign: "center" }}>
            <MailOutlineIcon sx={{ fontSize: 64, mb: 1 }} />
            <Typography>No messages</Typography>
          </Box>
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {!hideAppBar && <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 2 }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* Selection mode toolbar */}
          {showMailToolbar && selectionMode ? (
            <>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleClearSelection}
                sx={{ mr: 1 }}
                aria-label="clear selection"
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                {checkedIds.size} thread{checkedIds.size !== 1 ? "s" : ""} selected
              </Typography>
              {canMove && (
                <Tooltip title="Move">
                  <IconButton color="inherit" aria-label="move threads" onClick={(e) => setMoveAnchor(e.currentTarget)}>
                    <DriveFileMoveIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Delete">
                <IconButton
                  color="inherit"
                  aria-label="delete threads"
                  onClick={() => void handleDeleteThreads([...checkedIds])}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              {/* Leading icon: back arrow, hamburger, or logo */}
              {showBackArrow && (
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={showChatBack ? chatHeader!.onBack : handleBackToList}
                  sx={{ mr: 1 }}
                  aria-label="back to list"
                >
                  <ArrowBackIcon />
                </IconButton>
              )}
              {showHamburger && (
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={() => setMobileOpen((o) => !o)}
                  sx={{ mr: 1 }}
                  aria-label="open drawer"
                >
                  <MenuIcon />
                </IconButton>
              )}
              {showLogo && (
                <Box component="img" src="/mail.svg" alt="logo" sx={{ height: 32, ml: -1.6, mr: 0.9 }} />
              )}

              {/* Title / search */}
              {showSearchBar && searching ? (
                <InputBase
                  placeholder="Search…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchInput.trim()) {
                      setActiveFilter(searchInput.trim());
                      setSearching(false);
                    } else if (e.key === "Escape") {
                      setSearching(false);
                      setSearchInput("");
                    }
                  }}
                  autoFocus
                  sx={{
                    flexGrow: 1,
                    color: "inherit",
                    "& .MuiInputBase-input": { py: 0.5 },
                  }}
                />
              ) : chatSearching ? (
                <InputBase
                  placeholder="Search chats…"
                  value={chatHeader!.searchInput}
                  onChange={(e) => chatHeader!.onSearchInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      chatHeader!.onSearchCommit();
                    } else if (e.key === "Escape") {
                      chatHeader!.onSearchCancel();
                    }
                  }}
                  autoFocus
                  sx={{
                    flexGrow: 1,
                    color: "inherit",
                    "& .MuiInputBase-input": { py: 0.5 },
                  }}
                />
              ) : (
                <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                  {title}
                  {(mailSubtitle || chatHeader?.subtitle) && (
                    <Box component="span" sx={{ ml: 1, fontSize: 13, fontWeight: 400, opacity: 0.8 }}>
                      {mailSubtitle ?? chatHeader?.subtitle}
                    </Box>
                  )}
                </Typography>
              )}

              {/* Search toggle */}
              {showSearchBar && (
                searching ? (
                  <IconButton
                    color="inherit"
                    aria-label="close search"
                    onClick={() => { setSearching(false); setSearchInput(""); }}
                  >
                    <CloseIcon />
                  </IconButton>
                ) : (
                  <IconButton
                    color="inherit"
                    aria-label="search"
                    onClick={() => setSearching(true)}
                  >
                    <SearchIcon />
                  </IconButton>
                )
              )}
              {showChatSearchBar && (
                chatSearching ? (
                  <IconButton
                    color="inherit"
                    aria-label="close search"
                    onClick={chatHeader!.onSearchCancel}
                  >
                    <CloseIcon />
                  </IconButton>
                ) : (
                  <IconButton
                    color="inherit"
                    aria-label="search"
                    onClick={chatHeader!.onSearchStart}
                  >
                    <SearchIcon />
                  </IconButton>
                )
              )}

              {/* Chat list overflow menu (mobile only) */}
              {showChatListMenu && (
                <IconButton
                  color="inherit"
                  aria-label="more options"
                  edge="end"
                  onClick={(e) => setChatListMenuAnchor(e.currentTarget)}
                >
                  <MoreVertIcon />
                </IconButton>
              )}

              {/* Chat actions */}
              {showChatConvoActions && !chatSearching && (
                <>
                  <Tooltip title={chatHeader!.isMuted ? "Unmute" : "Mute"}>
                    <IconButton color="inherit" aria-label="toggle mute" onClick={chatHeader!.onToggleMute}>
                      {chatHeader!.isMuted ? <VolumeUpIcon /> : <VolumeOffIcon />}
                    </IconButton>
                  </Tooltip>
                  {chatHeader!.showInfoButton && (
                    <Tooltip title="Info">
                      <IconButton color="inherit" aria-label="show info" onClick={chatHeader!.onToggleInfo}>
                        <InfoOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="More">
                    <IconButton
                      color="inherit"
                      aria-label="chat options"
                      edge="end"
                      onClick={(e) => setChatMenuAnchor(e.currentTarget)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {/* Calendar actions */}
              {section === "calendar" && calendarHeader && (
                <>
                  <Tooltip title="Today">
                    <IconButton color="inherit" aria-label="today" onClick={calendarHeader.onToday}>
                      <TodayIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Previous">
                    <IconButton color="inherit" aria-label="previous" onClick={calendarHeader.onPrev}>
                      <ChevronLeftIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Next">
                    <IconButton color="inherit" aria-label="next" onClick={calendarHeader.onNext}>
                      <ChevronRightIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Change view">
                    <IconButton color="inherit" aria-label="change view" onClick={(e) => setCalViewAnchor(e.currentTarget)}>
                      <ViewAgendaIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {/* Thread actions */}
              {showThreadActions && (
                <>
                  <Tooltip title="Forward all">
                    <IconButton color="inherit" aria-label="forward all" onClick={() => setForwardRequested((n) => n + 1)}>
                      <PersonAddIcon />
                    </IconButton>
                  </Tooltip>
                  {canMove && (
                    <Tooltip title="Move to folder">
                      <IconButton color="inherit" aria-label="move to folder" onClick={(e) => setMoveAnchor(e.currentTarget)}>
                        <DriveFileMoveIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete thread">
                    <IconButton
                      color="inherit"
                      aria-label="delete thread"
                      onClick={() => selectedThread && void handleDeleteThreads([selectedThread.id])}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </>
          )}
        </Toolbar>
        <Menu
          anchorEl={moveAnchor}
          open={Boolean(moveAnchor)}
          onClose={() => setMoveAnchor(null)}
        >
          {currentAccount?.folders
            .filter((f) => f.id !== selectedFolder)
            .map((f) => (
              <MenuItem
                key={f.id}
                onClick={() => {
                  const ids = selectionMode
                    ? [...checkedIds]
                    : selectedThread
                      ? [selectedThread.id]
                      : [];
                  if (ids.length > 0) void handleMoveThreads(ids, f.id);
                  else setMoveAnchor(null);
                }}
              >
                {f.name}
              </MenuItem>
            ))}
        </Menu>
        <Menu
          anchorEl={chatListMenuAnchor}
          open={Boolean(chatListMenuAnchor)}
          onClose={() => setChatListMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={() => setChatListMenuAnchor(null)}>
            <SettingsIcon fontSize="small" sx={{ mr: 1.5 }} />
            Settings
          </MenuItem>
          <MenuItem
            onClick={() => {
              setChatListMenuAnchor(null);
              handleOpenAccount();
            }}
          >
            <AccountCircleIcon fontSize="small" sx={{ mr: 1.5 }} />
            Account
          </MenuItem>
        </Menu>
        <Menu
          anchorEl={chatMenuAnchor}
          open={Boolean(chatMenuAnchor)}
          onClose={() => setChatMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              setChatMenuAnchor(null);
              chatHeader?.onDelete?.();
            }}
          >
            <DeleteOutlineIcon fontSize="small" sx={{ mr: 1.5 }} />
            Delete chat
          </MenuItem>
          <MenuItem
            onClick={() => {
              setChatMenuAnchor(null);
              chatHeader?.onLeave?.();
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Leave chat
          </MenuItem>
        </Menu>
        <Menu
          anchorEl={calViewAnchor}
          open={Boolean(calViewAnchor)}
          onClose={() => setCalViewAnchor(null)}
        >
          {calendarHeader?.availableViews.map((v) => (
            <MenuItem
              key={v}
              selected={v === calendarHeader.view}
              onClick={() => {
                calendarHeader.onView(v);
                setCalViewAnchor(null);
              }}
            >
              {{ day: "Day", "3day": "3 Days", week5: "5 Days", week7: "Week", month: "Month", agenda: "Agenda" }[v]}
            </MenuItem>
          ))}
        </Menu>
      </AppBar>}

      {/* Section nav — icon rail (medium + large) */}
      {layout !== "mobile" && (
        <SectionNav section={section} onChange={handleSectionChange} isDesktop onAccountClick={handleOpenAccount} />
      )}

      {/* Mail folder drawer — temporary (mobile + medium) */}
      {layout !== "large" && section === "mail" && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              ...(layout === "medium" && { ml: `${RAIL_WIDTH}px` }),
            },
          }}
          slotProps={{ backdrop: { onClick: () => setMobileOpen(false) } }}
        >
          {layout === "mobile" ? sidebarMobile : sidebarDesktop}
        </Drawer>
      )}

      {/* Mail folder drawer — permanent (large only) */}
      {layout === "large" && section === "mail" && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              ml: `${RAIL_WIDTH}px`,
            },
          }}
          open
        >
          {sidebarDesktop}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          mt: hideAppBar ? 0 : { xs: "56px", sm: "64px" },
          mb: layout === "mobile" ? "56px" : 0,
          position: "relative",
          height: hideAppBar
            ? (layout === "mobile" ? "calc(100vh - 56px)" : "100vh")
            : (layout === "mobile" ? { xs: "calc(100vh - 56px - 56px)", sm: "calc(100vh - 64px - 56px)" } : { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" }),
          overflow: "hidden",
          display: "flex",
        }}
      >
        {section === "mail" && (
          multiPane ? (
            /* Two/three-pane: thread list + detail side by side */
            <>
              <Box
                sx={{
                  width: THREAD_LIST_WIDTH,
                  minWidth: 280,
                  flexShrink: 0,
                  borderRight: "1px solid",
                  borderColor: "divider",
                  overflow: "auto",
                }}
              >
                {mailList}
              </Box>
              <Box sx={{ flexGrow: 1, overflow: "auto" }}>
                {rightPane}
              </Box>
            </>
          ) : (
            /* Single-pane mobile */
            <Box sx={{ flexGrow: 1, overflow: "auto" }}>
              {mailView === "list" && mailList}
              {(mailView === "thread" || mailView === "compose") && rightPane}
            </Box>
          )
        )}

        <Box sx={{ flexGrow: 1, flexDirection: "column", overflow: "hidden", display: section === "calendar" ? "flex" : "none" }}>
          <CalendarView drawerOpen={section === "calendar" && mobileOpen} onDrawerClose={() => setMobileOpen(false)} layout={layout} onHeaderChange={setCalendarHeader} onAccountClick={handleOpenAccount} />
        </Box>
        <Box sx={{ flexGrow: 1, overflow: "hidden", display: section === "chat" ? "block" : "none" }}>
          <ChatView onHeaderChange={setChatHeader} />
        </Box>
      </Box>

      {/* FABs */}
      {section === "mail" && !selectionMode && mailView !== "compose" && (multiPane || mailView === "list") && (
        <Fab
          color="primary"
          aria-label="compose"
          onClick={handleOpenCompose}
          sx={{ position: "fixed", bottom: layout === "mobile" ? 80 : 24, right: 24 }}
        >
          <EditIcon />
        </Fab>
      )}
      {section === "mail" && mailView === "thread" && !hasPaneOpen && (
        <Fab
          color="primary"
          aria-label="reply"
          onClick={() => setReplyRequested((n) => n + 1)}
          sx={{ position: "fixed", bottom: layout === "mobile" ? 80 : 24, right: multiPane ? 88 : 24 }}
        >
          <ReplyIcon />
        </Fab>
      )}

      {/* Section nav — mobile bottom bar */}
      {layout === "mobile" && (
        <SectionNav section={section} onChange={handleSectionChange} isDesktop={false} />
      )}

      <AccountScreen
        open={accountOpen}
        profile={profile}
        accountEmail={user.email}
        onClose={() => setAccountOpen(false)}
        onSave={setProfile}
        onSignOut={logout}
      />
    </Box>
  );
}
