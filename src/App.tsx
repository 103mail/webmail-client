import { useState, useMemo } from "react";
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import ForwardIcon from "@mui/icons-material/Forward";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { Sidebar } from "./components/Sidebar";
import { ComposeScreen } from "./components/ComposeScreen";
import { MailList } from "./components/MailList";
import { ThreadDetail } from "./components/ThreadDetail";
import { sampleThreads } from "./data/messages";
import type { MailThread } from "./types";

const DRAWER_WIDTH = 280;

type View = "list" | "thread" | "compose";

export function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>("john-inbox");
  const [selectedThread, setSelectedThread] = useState<MailThread | null>(null);
  const [view, setView] = useState<View>("list");
  const [searching, setSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const folderThreads = useMemo(
    () => sampleThreads.filter((t) => t.folderId === selectedFolder),
    [selectedFolder]
  );

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    setSelectedThread(null);
    setView("list");
    if (!isDesktop) setMobileOpen(false);
  };

  const handleSelectThread = (thread: MailThread) => {
    setSelectedThread(thread);
    setView("thread");
  };

  const handleBackToList = () => {
    setSelectedThread(null);
    setView("list");
  };

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
              <Tooltip title="Mark unread">
                <IconButton color="inherit" aria-label="mark unread">
                  <MarkEmailUnreadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Forward all">
                <IconButton color="inherit" aria-label="forward all">
                  <ForwardIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete thread">
                <IconButton color="inherit" aria-label="delete thread">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
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
          <ThreadDetail thread={selectedThread} />
        )}
        {view === "list" && (
          <MailList
            threads={folderThreads}
            onSelect={handleSelectThread}
            selectedId={selectedThread?.id ?? null}
            searchQuery={activeFilter}
            onClearSearch={() => { setActiveFilter(""); setSearchInput(""); }}
          />
        )}

        {view !== "compose" && (
          <Fab
            color="primary"
            aria-label="compose"
            onClick={() => setView("compose")}
            sx={{ position: "fixed", bottom: 24, right: 24 }}
          >
            <EditIcon />
          </Fab>
        )}
      </Box>
    </Box>
  );
}
