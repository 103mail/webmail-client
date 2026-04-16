import {
  Box,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { CalendarViewKind } from "./types";

const LABEL: Record<CalendarViewKind, string> = {
  day: "Day",
  "3day": "3 days",
  week5: "5 days",
  week7: "Week",
  month: "Month",
  agenda: "Agenda",
};

interface ToolbarProps {
  title: string;
  view: CalendarViewKind;
  onView: (v: CalendarViewKind) => void;
  availableViews: CalendarViewKind[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarToolbar({
  title,
  view,
  onView,
  availableViews,
  onPrev,
  onNext,
  onToday,
}: ToolbarProps) {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
        py: 1,
      }}
    >
      <Button variant="outlined" size="small" onClick={onToday}>
        Today
      </Button>
      <IconButton size="small" onClick={onPrev} aria-label="previous">
        <ChevronLeftIcon />
      </IconButton>
      <IconButton size="small" onClick={onNext} aria-label="next">
        <ChevronRightIcon />
      </IconButton>
      <Typography
        variant="h6"
        sx={{ ml: 1, flexGrow: 1, minWidth: 0 }}
        noWrap
      >
        {title}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={view}
        onChange={(_, v) => v && onView(v)}
      >
        {availableViews.map((v) => (
          <ToggleButton key={v} value={v} sx={{ textTransform: "none", px: 1.5 }}>
            {isSm ? LABEL[v] : LABEL[v].split(" ")[0]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
