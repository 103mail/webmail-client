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
import type { MailAccount } from "../../types";

interface AccountsPanelProps {
  accounts: MailAccount[];
  colors: Record<string, string>;
  enabled: Set<string>;
  onToggle: (email: string) => void;
}

export function AccountsPanel({ accounts, colors, enabled, onToggle }: AccountsPanelProps) {
  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
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
  );
}
