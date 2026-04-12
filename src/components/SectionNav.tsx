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
}

export function SectionNav({ section, onChange, isDesktop }: SectionNavProps) {
  if (isDesktop) {
    return (
      <Box
        sx={{
          width: 56,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: "76px",
          gap: 1,
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        {sections.map((s) => (
          <Tooltip key={s.value} title={s.label} placement="right">
            <IconButton
              onClick={() => onChange(s.value)}
              color={section === s.value ? "primary" : "default"}
              aria-label={s.label}
            >
              {s.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
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
