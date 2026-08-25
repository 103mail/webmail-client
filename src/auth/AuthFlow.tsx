import { useState } from "react";
import { Box, Card, CardContent, Link, Typography } from "@mui/material";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { useDomain } from "../DomainContext";

type AuthScreen = "login" | "register" | "forgot";

export function AuthFlow() {
  const { brand } = useDomain();
  const [screen, setScreen] = useState<AuthScreen>("login");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "grey.100",
        p: 2,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <Box component="img" src={brand.logo} alt={brand.name} sx={{ height: 64 }} />
      </Box>
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
      <Typography variant="body2" align="center" sx={{ mt: 3, color: "rgba(0,0,0,0.25)" }}>
        Powered by:{" "}
        <Link href={brand.marketingUrl} target="_blank" rel="noopener" underline="hover" color="inherit">
          {brand.name}
        </Link>
      </Typography>
    </Box>
  );
}
