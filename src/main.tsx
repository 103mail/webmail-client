import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./auth/AuthContext";
import { DomainProvider } from "./DomainContext";
import { loadConfig } from "./config";
import { Root } from "./Root";
import "./styles.css";

// The bundle is domain-agnostic, so nothing can render until the Domain it is
// serving is known. /config.json is fetched first and everything below it reads
// the result through DomainContext (federation design, section 2).
const root = createRoot(document.getElementById("root")!);

loadConfig().then(
  (config) => {
    document.title = config.brand.name;
    root.render(
      <StrictMode>
        <DomainProvider config={config}>
          <AuthProvider>
            <Root />
          </AuthProvider>
        </DomainProvider>
      </StrictMode>
    );
  },
  (error: unknown) => {
    root.render(
      <div style={{ font: "16px system-ui", margin: "3rem auto", maxWidth: "40rem" }}>
        <h1>This domain is not configured</h1>
        <p>
          The server did not serve a usable <code>/config.json</code>, so the client does
          not know which domain it belongs to or where its API is.
        </p>
        <pre style={{ whiteSpace: "pre-wrap", color: "#900" }}>{String(error)}</pre>
      </div>
    );
  }
);
