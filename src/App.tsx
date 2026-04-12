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
import { Sidebar } from "./components/Sidebar";
import { ComposeScreen } from "./components/ComposeScreen";
import { MailList } from "./components/MailList";
import { ThreadDetail } from "./components/ThreadDetail";
import { sampleThreads } from "./data/messages";
import { accounts } from "./data/accounts";
import type { MailThread } from "./types";

const DRAWER_WIDTH = 280;

type View = "list" | "thread" | "compose";

export function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>("john-inbox");
  const [selectedThread, setSelectedThread] = useState<MailThread | null>(null);
  const [view, setView] = useState<View>("list");
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
    setView("list");
    if (!isDesktop) setMobileOpen(false);
  };

  const handleSelectThread = (thread: MailThread) => {
    setSelectedThread(thread);
    setView("thread");
    history.pushState({ view: "thread", threadId: thread.id }, "");
  };

  const handleBackToList = () => {
    history.back();
  };

  // Push history state when entering compose
  const handleOpenCompose = () => {
    setView("compose");
    history.pushState({ view: "compose" }, "");
  };

  // Handle browser back button
  useEffect(() => {
    const onPopState = () => {
      setView((currentView) => {
        if (currentView === "compose" || currentView === "thread") {
          setSelectedThread(null);
          return "list";
        }
        return currentView;
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

  const title =
    view === "compose"
      ? "Compose"
      : view === "thread" && selectedThread
        ? selectedThread.subject
        : "Inbox";

  const sidebar = (
    <Sidebar
      selectedFolder={selectedFolder}
      onSelectFolder={handleSelectFolder}
    />
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar>
          {/* Selection mode toolbar */}
          {view === "list" && selectionMode ? (
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
              {view === "thread" ? (
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
                !isDesktop && (
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
              {view === "list" && searching ? (
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
              {view === "list" && (
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
              {view === "thread" && (
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

      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
          slotProps={{ backdrop: { onClick: () => setMobileOpen(false) } }}
        >
          {sidebar}
        </Drawer>
      )}

      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
          open
        >
          {sidebar}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          pt: "64px",
          position: "relative",
        }}
      >
        {view === "compose" && selectedFolder && (
          <ComposeScreen
            folderId={selectedFolder}
            onDiscard={() => setView("list")}
          />
        )}
        {view === "thread" && selectedThread && (
          <ThreadDetail thread={selectedThread} replyRequested={replyRequested} forwardRequested={forwardRequested} onPaneChange={setHasPaneOpen} />
        )}
        {view === "list" && (
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

        {view === "list" && !selectionMode && (
          <Fab
            color="primary"
            aria-label="compose"
            onClick={handleOpenCompose}
            sx={{ position: "fixed", bottom: 24, right: 24 }}
          >
            <EditIcon />
          </Fab>
        )}
        {view === "thread" && !hasPaneOpen && (
          <Fab
            color="primary"
            aria-label="reply"
            onClick={() => setReplyRequested((n) => n + 1)}
            sx={{ position: "fixed", bottom: 24, right: 24 }}
          >
            <ReplyIcon />
          </Fab>
        )}
      </Box>
    </Box>
  );
}
