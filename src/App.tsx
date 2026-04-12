import { useState, useMemo, useCallback, useEffect } from "react";
import {
  AppBar,
  Box,
  Drawer,
  Fab,
  IconButton,
  InputBase,
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
import { SectionNav } from "./components/SectionNav";
import type { Section } from "./components/SectionNav";
import { Sidebar } from "./components/Sidebar";
import { ComposeScreen } from "./components/ComposeScreen";
import { MailList } from "./components/MailList";
import { ThreadDetail } from "./components/ThreadDetail";
import { CalendarView } from "./components/CalendarView";
import { ChatView } from "./components/ChatView";
import { sampleThreads } from "./data/messages";
import { accounts } from "./data/accounts";
import type { MailThread } from "./types";

const DRAWER_WIDTH = 280;
const RAIL_WIDTH = 56;

type MailView = "list" | "thread" | "compose";

export function App() {
  const [section, setSection] = useState<Section>("mail");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>("john-inbox");
  const [selectedThread, setSelectedThread] = useState<MailThread | null>(null);
  const [mailView, setMailView] = useState<MailView>("list");
  const [replyRequested, setReplyRequested] = useState(0);
  const [forwardRequested, setForwardRequested] = useState(0);
  const [hasPaneOpen, setHasPaneOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const selectionMode = checkedIds.size > 0;
  const currentAccount = accounts.find((a) => a.folders.some((f) => f.id === selectedFolder));
  const canMove = (currentAccount?.folders.length ?? 0) > 1;

  const folderThreads = useMemo(
    () => sampleThreads.filter((t) => t.folderId === selectedFolder),
    [selectedFolder]
  );

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    setSelectedThread(null);
    setCheckedIds(new Set());
    setMailView("list");
    if (!isDesktop) setMobileOpen(false);
  };

  const handleSelectThread = (thread: MailThread) => {
    setSelectedThread(thread);
    setMailView("thread");
    history.pushState({ mailView: "thread", threadId: thread.id }, "");
  };

  const handleBackToList = () => {
    history.back();
  };

  const handleOpenCompose = () => {
    setMailView("compose");
    history.pushState({ mailView: "compose" }, "");
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

  const handleSectionChange = (s: Section) => {
    setSection(s);
    setCheckedIds(new Set());
  };

  const title =
    section === "calendar"
      ? "Calendar"
      : section === "chat"
        ? "Chat"
        : mailView === "compose"
          ? "Compose"
          : mailView === "thread" && selectedThread
            ? selectedThread.subject
            : "Inbox";

  const sidebarDesktop = (
    <Sidebar
      selectedFolder={selectedFolder}
      onSelectFolder={handleSelectFolder}
    />
  );

  const sidebarMobile = (
    <Sidebar
      selectedFolder={selectedFolder}
      onSelectFolder={handleSelectFolder}
      showSettingsAccount
    />
  );

  const showMailToolbar = section === "mail";

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 2 }}
      >
        <Toolbar>
          {/* Selection mode toolbar */}
          {showMailToolbar && mailView === "list" && selectionMode ? (
            <>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleClearSelection}
                sx={{ mr: 2 }}
                aria-label="clear selection"
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                {checkedIds.size} thread{checkedIds.size !== 1 ? "s" : ""} selected
              </Typography>
              {canMove && (
                <Tooltip title="Move">
                  <IconButton color="inherit" aria-label="move threads">
                    <DriveFileMoveIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Delete">
                <IconButton color="inherit" aria-label="delete threads">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              {showMailToolbar && mailView === "thread" ? (
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={handleBackToList}
                  sx={{ mr: 2 }}
                  aria-label="back to list"
                >
                  <ArrowBackIcon />
                </IconButton>
              ) : (
                !isDesktop && section === "mail" && (
                  <IconButton
                    color="inherit"
                    edge="start"
                    onClick={() => setMobileOpen((o) => !o)}
                    sx={{ mr: 2 }}
                    aria-label="open drawer"
                  >
                    <MenuIcon />
                  </IconButton>
                )
              )}
              {showMailToolbar && mailView === "list" && searching ? (
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
                    "& .MuiInputBase-input": {
                      py: 0.5,
                    },
                  }}
                />
              ) : (
                <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                  {title}
                </Typography>
              )}
              {showMailToolbar && mailView === "list" && (
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
              {showMailToolbar && mailView === "thread" && (
                <>
                  <Tooltip title="Forward all">
                    <IconButton color="inherit" aria-label="forward all" onClick={() => setForwardRequested((n) => n + 1)}>
                      <PersonAddIcon />
                    </IconButton>
                  </Tooltip>
                  {canMove && (
                    <Tooltip title="Move to folder">
                      <IconButton color="inherit" aria-label="move to folder">
                        <DriveFileMoveIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete thread">
                    <IconButton color="inherit" aria-label="delete thread">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Section nav — desktop icon rail */}
      {isDesktop && (
        <SectionNav section={section} onChange={handleSectionChange} isDesktop />
      )}

      {/* Mail folder drawer — mobile */}
      {!isDesktop && section === "mail" && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
          slotProps={{ backdrop: { onClick: () => setMobileOpen(false) } }}
        >
          {sidebarMobile}
        </Drawer>
      )}

      {/* Mail folder drawer — desktop */}
      {isDesktop && section === "mail" && (
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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          mt: "64px",
          mb: isDesktop ? 0 : "56px",
          position: "relative",
          height: isDesktop ? "calc(100vh - 64px)" : "calc(100vh - 64px - 56px)",
          overflow: "auto",
        }}
      >
        {section === "mail" && (
          <>
            {mailView === "compose" && selectedFolder && (
              <ComposeScreen
                folderId={selectedFolder}
                onDiscard={() => setMailView("list")}
              />
            )}
            {mailView === "thread" && selectedThread && (
              <ThreadDetail thread={selectedThread} replyRequested={replyRequested} forwardRequested={forwardRequested} onPaneChange={setHasPaneOpen} />
            )}
            {mailView === "list" && (
              <MailList
                threads={folderThreads}
                onSelect={handleSelectThread}
                selectedId={selectedThread?.id ?? null}
                searchQuery={activeFilter}
                onClearSearch={() => { setActiveFilter(""); setSearchInput(""); }}
                checkedIds={checkedIds}
                onToggleChecked={handleToggleChecked}
              />
            )}

            {mailView === "list" && !selectionMode && (
              <Fab
                color="primary"
                aria-label="compose"
                onClick={handleOpenCompose}
                sx={{ position: "fixed", bottom: isDesktop ? 24 : 80, right: 24 }}
              >
                <EditIcon />
              </Fab>
            )}
            {mailView === "thread" && !hasPaneOpen && (
              <Fab
                color="primary"
                aria-label="reply"
                onClick={() => setReplyRequested((n) => n + 1)}
                sx={{ position: "fixed", bottom: isDesktop ? 24 : 80, right: 24 }}
              >
                <ReplyIcon />
              </Fab>
            )}
          </>
        )}

        {section === "calendar" && <CalendarView />}
        {section === "chat" && <ChatView />}
      </Box>

      {/* Section nav — mobile bottom bar */}
      {!isDesktop && (
        <SectionNav section={section} onChange={handleSectionChange} isDesktop={false} />
      )}
    </Box>
  );
}
