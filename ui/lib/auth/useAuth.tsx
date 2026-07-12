"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authFetch, clearTokens, getAccessToken } from "@/lib/auth/client";

interface Session {
  wallet: string;
  userId?: string;
  expiresAt: string;
}

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
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
    const res = await authFetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setSession(data.session ?? null);
    } else {
      setSession(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshSession();
    const onSession = () => refreshSession();
    window.addEventListener("nexora:session", onSession);
    return () => window.removeEventListener("nexora:session", onSession);
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await authFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearTokens();
    setSession(null);
    window.dispatchEvent(new Event("nexora:session"));
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
