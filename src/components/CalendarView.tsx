import { Box, Typography } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export function CalendarView() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 2, color: "text.secondary" }}>
      <CalendarMonthIcon sx={{ fontSize: 64 }} />
      <Typography variant="h6">Calendar</Typography>
      <Typography variant="body2">Coming soon</Typography>
    </Box>
  );
}
