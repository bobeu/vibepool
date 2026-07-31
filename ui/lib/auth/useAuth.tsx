"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  authFetch,
  clearTokens,
  getAccessToken,
  refreshAccessToken,
} from "@/lib/auth/client";

interface Session {
  wallet: string;
  userId?: string;
  expiresAt: string;
  isGuest?: boolean;
  freePlay?: boolean;
}

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  isFreePlay: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  isFreePlay: false,
  refreshSession: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    if (!getAccessToken()) {
      setSession(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await authFetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data.session ?? null);
      } else {
        // Stored credentials are dead; drop them so bootstrap can mint a new session.
        clearTokens();
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
    const onSession = () => refreshSession();
    window.addEventListener("nexora:session", onSession);
    const interval = setInterval(() => {
      if (!session?.expiresAt) return;
      const expires = new Date(session.expiresAt).getTime();
      if (Date.now() < expires - 60_000) return;
      void refreshAccessToken().then((ok) => {
        if (ok) return refreshSession();
        clearTokens();
        setSession(null);
      });
    }, 30_000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("nexora:session", onSession);
    };
  }, [refreshSession, session?.expiresAt]);

  const logout = useCallback(async () => {
    await authFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearTokens();
    setSession(null);
    window.dispatchEvent(new Event("nexora:session"));
  }, []);

  const isFreePlay = Boolean(session?.freePlay || session?.isGuest);

  return (
    <AuthContext.Provider value={{ session, isLoading, isFreePlay, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
