import {
  Box,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import type { MailAccount } from "../../types";

interface AccountsPanelProps {
  accounts: MailAccount[];
  colors: Record<string, string>;
  enabled: Set<string>;
  onToggle: (email: string) => void;
  showSettingsAccount?: boolean;
  onAccountClick?: () => void;
}

export function AccountsPanel({ accounts, colors, enabled, onToggle, showSettingsAccount = false, onAccountClick }: AccountsPanelProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1, flexGrow: 1, overflow: "auto" }}>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.6,
            fontWeight: 700,
            color: "text.secondary",
          }}
        >
          Calendars
        </Typography>
        <List dense disablePadding>
          {accounts.map((a) => {
            const color = colors[a.email] ?? "#607d8b";
            const checked = enabled.has(a.email);
            return (
              <ListItem key={a.email} disablePadding>
                <ListItemButton onClick={() => onToggle(a.email)} sx={{ borderRadius: 1 }}>
                  <ListItemIcon sx={{ minWidth: 34 }}>
                    <Checkbox
                      edge="start"
                      checked={checked}
                      disableRipple
                      sx={{
                        p: 0.5,
                        color,
                        "&.Mui-checked": { color },
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={a.email}
                    slotProps={{
                      primary: {
                        variant: "body2",
                        noWrap: true,
                        sx: { fontWeight: checked ? 500 : 400 },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {showSettingsAccount && (
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
            <ListItemButton onClick={onAccountClick}>
              <ListItemIcon>
                <AccountCircleIcon />
              </ListItemIcon>
              <ListItemText primary="Account" />
            </ListItemButton>
          </ListItem>
        </List>
      )}
    </Box>
  );
}
