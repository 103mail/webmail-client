import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import { accounts } from "../data/accounts";

interface SidebarProps {
  selectedFolder: string | null;
  onSelectFolder: (folderId: string) => void;
}

export function Sidebar({ selectedFolder, onSelectFolder }: SidebarProps) {
  return (
    <>
      <Toolbar />
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
                <ListItemText primary={folder.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ))}
    </>
  );
}
