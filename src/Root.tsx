import { useAuth } from "./auth/AuthContext";
import { AuthFlow } from "./auth/AuthFlow";
import { App } from "./App";

export function Root() {
  const { user } = useAuth();
  return user ? <App /> : <AuthFlow />;
}
