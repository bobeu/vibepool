const TOKEN_KEY = "nexora_access_token";
const REFRESH_KEY = "nexora_refresh_token";
const GUEST_KEY = "nexora_free_play";

/** Auth endpoints must never trigger recovery, or a 401 would recurse forever. */
const AUTH_PATHS = [
  "/api/auth/session",
  "/api/auth/refresh",
  "/api/auth/guest",
  "/api/auth/login",
  "/api/auth/logout",
];

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(GUEST_KEY);
}

export function isFreePlaySession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GUEST_KEY) === "1";
}

/** Confirms the stored access token still maps to a live server session. */
export async function validateAccessToken(): Promise<boolean> {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const res = await fetch("/api/auth/session", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Rotates the access token and stores the new pair. The server replaces the
 * token on every refresh, so skipping the write would invalidate the session.
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.accessToken) return false;
    setTokens(data.accessToken, data.refreshToken ?? data.accessToken);
    return true;
  } catch {
    return false;
  }
}

let guestRequest: Promise<boolean> | null = null;

async function createGuestSession(): Promise<boolean> {
  clearTokens();
  try {
    const res = await fetch("/api/auth/guest", { method: "POST" });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.accessToken) return false;
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem(GUEST_KEY, "1");
    window.dispatchEvent(new Event("nexora:session"));
    return true;
  } catch {
    return false;
  }
}

/**
 * Start a guest free-play session (no wallet / no funds).
 * Reuses a still-valid session and only mints a new guest player when the
 * stored credentials are genuinely dead, so refreshes don't pile up profiles.
 */
export async function startFreePlaySession(options?: { force?: boolean }): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (!options?.force && getAccessToken()) {
    if (await validateAccessToken()) return true;
    if (await refreshAccessToken()) return true;
  }

  // Concurrent callers share one request instead of creating duplicate guests.
  if (!guestRequest) {
    guestRequest = createGuestSession().finally(() => {
      guestRequest = null;
    });
  }
  return guestRequest;
}

let recovery: Promise<boolean> | null = null;

function recoverSession(): Promise<boolean> {
  if (!recovery) {
    recovery = (async () => {
      if (await refreshAccessToken()) return true;
      // Wallet-backed sessions need a fresh signature, so only guests re-mint.
      if (!isFreePlaySession()) return false;
      return startFreePlaySession({ force: true });
    })().finally(() => {
      recovery = null;
    });
  }
  return recovery;
}

export async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const send = () => {
    const token = getAccessToken();
    return fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  };

  const res = await send();
  if (res.status !== 401) return res;
  if (AUTH_PATHS.some((path) => input.startsWith(path))) return res;

  const recovered = await recoverSession();
  if (!recovered) return res;
  return send();
}
