// Runtime configuration, fetched before first render.
//
// One bundle serves every Domain (federation design, section 2). Nothing about
// 103mail.com is compiled in: the hostname the bundle was served from decides
// which Domain it is, and /config.json served by that Domain supplies the rest.

export interface Brand {
  name: string;
  logo: string;
  marketingUrl: string;
}

export interface DomainConfig {
  domain: string;
  apiBase: string;
  brand: Brand;
}

// Used by `npm run dev`, where Vite serves the bundle and there is no backend
// on the same origin to answer /config.json. Point VITE_API_BASE at a locally
// running webmail-server.
const DEV_FALLBACK: DomainConfig = {
  domain: import.meta.env.VITE_DOMAIN ?? "localhost",
  apiBase: import.meta.env.VITE_API_BASE ?? "http://localhost:8099/api/v1",
  brand: {
    name: import.meta.env.VITE_BRAND_NAME ?? "webmail",
    logo: "/mail.svg",
    marketingUrl: "#",
  },
};

function isLoopback(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

// The RFC roots every endpoint at https://webmail.{domain} and nowhere else, so
// a config pointing the API somewhere else is a misconfigured deployment rather
// than something to work around. Loopback is exempt: that is `npm run dev`.
function check(config: DomainConfig): DomainConfig {
  if (!config.domain || !config.apiBase) {
    throw new Error("config.json must carry a domain and an apiBase");
  }
  const url = new URL(config.apiBase, window.location.origin);
  if (isLoopback(url.hostname)) return config;
  const expected = `webmail.${config.domain}`;
  if (url.hostname !== expected) {
    throw new Error(
      `config.json points apiBase at ${url.hostname}; every endpoint must be served from ${expected}`
    );
  }
  return config;
}

export async function loadConfig(): Promise<DomainConfig> {
  try {
    const response = await fetch("/config.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`config.json: ${response.status}`);
    return check((await response.json()) as DomainConfig);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("falling back to the development config:", error);
      return DEV_FALLBACK;
    }
    throw error;
  }
}
