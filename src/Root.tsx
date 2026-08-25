import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./auth/AuthContext";
import { AuthFlow } from "./auth/AuthFlow";
import { App } from "./App";

export function Root() {
  const { user, ready } = useAuth();

  // A stored token is checked against the server before anything renders, so a
  // reload does not flash the sign-in form at an already signed-in user.
  if (!ready) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }
  return user ? <App /> : <AuthFlow />;
}
