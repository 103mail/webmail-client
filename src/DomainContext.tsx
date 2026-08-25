import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { DomainConfig } from "./config";

// Which Domain this bundle is serving. Resolved once at boot from /config.json
// and constant for the life of the page, so there is no setter: a different
// Domain is a different hostname and therefore a different page load.

const DomainContext = createContext<DomainConfig | null>(null);

export function DomainProvider({
  config,
  children,
}: {
  config: DomainConfig;
  children: ReactNode;
}) {
  return <DomainContext.Provider value={config}>{children}</DomainContext.Provider>;
}

export function useDomain(): DomainConfig {
  const ctx = useContext(DomainContext);
  if (!ctx) throw new Error("useDomain must be used within DomainProvider");
  return ctx;
}
