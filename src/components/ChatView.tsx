import { Box, Typography } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";

export function ChatView() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 2, color: "text.secondary" }}>
      <ChatIcon sx={{ fontSize: 64 }} />
      <Typography variant="h6">Chat</Typography>
      <Typography variant="body2">Coming soon</Typography>
    </Box>
  );
}
