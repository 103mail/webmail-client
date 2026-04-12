import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { accounts } from "../data/accounts";

interface SidebarProps {
  selectedFolder: string | null;
  onSelectFolder: (folderId: string) => void;
  showSettingsAccount?: boolean;
}

export function Sidebar({ selectedFolder, onSelectFolder, showSettingsAccount = false }: SidebarProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar />
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {accounts.map((account) => (
          <List
            key={account.email}
            subheader={
              <ListSubheader component="div">{account.email}</ListSubheader>
            }
            disablePadding
          >
            {account.folders.map((folder) => (
              <ListItem key={folder.id} disablePadding>
                <ListItemButton
                  selected={selectedFolder === folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <ListItemIcon>
                    <InboxIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={folder.name}
                    sx={folder.unreadCount > 0 ? { "& .MuiListItemText-primary": { fontWeight: 700 } } : undefined}
                  />
                  {folder.unreadCount > 0 && (
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {folder.unreadCount}
                    </Typography>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ))}
      </Box>

      {showSettingsAccount && (
        <>
          <Divider />
          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                <ListItemText primary="Account" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );
}
