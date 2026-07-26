const TOKEN_KEY = "nexora_access_token";
const REFRESH_KEY = "nexora_refresh_token";
const GUEST_KEY = "nexora_free_play";

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

/** Start a guest free-play session (no wallet / no funds). */
export async function startFreePlaySession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (getAccessToken() && isFreePlaySession()) return true;

  const res = await fetch("/api/auth/guest", { method: "POST" });
  if (!res.ok) return false;
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  localStorage.setItem(GUEST_KEY, "1");
  window.dispatchEvent(new Event("nexora:session"));
  return true;
}

export async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  return fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}
