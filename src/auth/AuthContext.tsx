import { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { ApiClient, ApiError } from "../api/client";
import { useDomain } from "../DomainContext";

export interface User {
  name: string;
  email: string;
  userId: number;
  customerId: number;
}

interface AuthContextValue {
  user: User | null;
  api: ApiClient;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Tokens are scoped to the Domain that issued them. Keying storage by domain is
// what lets 103mail.com and example.com be open in two tabs without one signing
// the other out (federation design, section 2).
const storageKey = (domain: string) => `webmail:${domain}:token`;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // private mode, or storage disabled
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* the session simply does not survive a reload */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const config = useDomain();
  const key = storageKey(config.domain);

  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  // The client reads the token through a ref so that signing in does not have
  // to rebuild it, and so a 401 can clear it from inside a request.
  const token = useRef<string | null>(read(key));

  const clear = useCallback(() => {
    token.current = null;
    write(key, null);
    setUser(null);
  }, [key]);

  const api = useMemo(
    () => new ApiClient(config.apiBase, () => token.current, clear),
    [config.apiBase, clear]
  );

  // Resume a stored session. GET /auth/token is the check: it answers the
  // account behind the token, or 401 if the server no longer knows it.
  const resume = useCallback(async () => {
    if (!token.current) {
      setReady(true);
      return;
    }
    try {
      const account = await api.currentUser();
      if (account) {
        setUser({
          name: account.name || account.email,
          email: account.email,
          userId: account.userId,
          customerId: account.customerId,
        });
      } else {
        clear();
      }
    } catch {
      clear();
    } finally {
      setReady(true);
    }
  }, [api, clear]);

  // Run once, on mount. useState's initialiser is the wrong place for a promise
  // and useEffect would fire twice under StrictMode.
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    void resume();
  }

  const login = useCallback(
    async (email: string, password: string) => {
      const issued = await api.login(email, password);
      if (!issued) throw new Error("Wrong email address or password.");
      token.current = issued.value;
      write(key, issued.value);
      const account = await api.currentUser();
      if (!account) {
        clear();
        throw new Error("Signed in, but the account could not be read.");
      }
      setUser({
        name: account.name || account.email,
        email: account.email,
        userId: account.userId,
        customerId: account.customerId,
      });
    },
    [api, key, clear]
  );

  // Self-registration has no endpoint. The server creates accounts through
  // external onboarding: a recipient with no account is sent a content-free
  // invite carrying a single-use token (ADR 6). Until that flow reaches the
  // client, this reports rather than pretends.
  const register = useCallback(async (_name: string, _email: string, _password: string) => {
    throw new ApiError(
      501,
      "Accounts are created by invitation. Ask someone on this domain to send you one."
    );
  }, []);

  const logout = useCallback(() => clear(), [clear]);

  return (
    <AuthContext.Provider value={{ user, api, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// The signed-in user, for the many places that only make sense once there is
// one. Throws rather than handing back a null the caller has to re-check.
export function useSession(): { user: User; api: ApiClient } {
  const { user, api } = useAuth();
  if (!user) throw new Error("useSession used outside a signed-in tree");
  return { user, api };
}
