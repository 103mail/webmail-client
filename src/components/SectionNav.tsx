import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  IconButton,
  Paper,
  Tooltip,
} from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChatIcon from "@mui/icons-material/Chat";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export type Section = "mail" | "calendar" | "chat";

const sections: { value: Section; label: string; icon: React.ReactElement }[] = [
  { value: "mail", label: "Mail", icon: <MailIcon /> },
  { value: "calendar", label: "Calendar", icon: <CalendarMonthIcon /> },
  { value: "chat", label: "Chat", icon: <ChatIcon /> },
];

interface SectionNavProps {
  section: Section;
  onChange: (section: Section) => void;
  isDesktop: boolean;
  onAccountClick?: () => void;
  onSettingsClick?: () => void;
}

export function SectionNav({ section, onChange, isDesktop, onAccountClick, onSettingsClick }: SectionNavProps) {
  if (isDesktop) {
    return (
      <>
      <Box sx={{ width: 60, flexShrink: 0 }} />
      <Box
        sx={{
          // The padding and border count towards the 60px, or the fixed rail is
          // wider than its spacer and covers the first pixels of the next pane.
          width: 60,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pl: "2px",
          pt: "72px",
          gap: 0.5,
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        {sections.map((s) => (
          <Tooltip key={s.value} title={s.label} placement="right">
            <IconButton
              size="large"
              onClick={() => onChange(s.value)}
              color={section === s.value ? "primary" : "default"}
              aria-label={s.label}
            >
              {s.icon}
            </IconButton>
          </Tooltip>
        ))}

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Settings" placement="right">
          <IconButton size="large" aria-label="settings" onClick={onSettingsClick}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Account" placement="right">
          <IconButton size="large" aria-label="account" sx={{ mb: 1 }} onClick={onAccountClick}>
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
      </Box>
      </>
    );
  }

  return (
    <Paper
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.appBar }}
      elevation={3}
    >
      <BottomNavigation
        value={section}
        onChange={(_e, val) => onChange(val)}
        showLabels
      >
        {sections.map((s) => (
          <BottomNavigationAction
            key={s.value}
            label={s.label}
            value={s.value}
            icon={s.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
