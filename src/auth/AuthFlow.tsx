import { useState } from "react";
import { Box, Card, CardContent } from "@mui/material";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

type AuthScreen = "login" | "register" | "forgot";

export function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>("login");

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "grey.100",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          {screen === "login" && (
            <LoginForm
              onSwitchToRegister={() => setScreen("register")}
              onSwitchToForgot={() => setScreen("forgot")}
            />
          )}
          {screen === "register" && (
            <RegisterForm onSwitchToLogin={() => setScreen("login")} />
          )}
          {screen === "forgot" && (
            <ForgotPasswordForm onSwitchToLogin={() => setScreen("login")} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
