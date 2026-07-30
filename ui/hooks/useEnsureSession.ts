"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { getAccessToken, isFreePlaySession, startFreePlaySession } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";

/**
 * Ensures a JWT session exists for API calls.
 * - Wallet connected → WalletSessionSync handles SIWE login
 * - Wallet disconnected → start guest free-play session
 */
export function useEnsureSession() {
  const { isConnected } = useAccount();
  const { session, isLoading, refreshSession, isFreePlay } = useAuth();
  const starting = useRef(false);

  useEffect(() => {
    if (isLoading || isConnected) return;
    if (getAccessToken() && (session || isFreePlaySession())) return;
    if (starting.current) return;
    starting.current = true;
    void startFreePlaySession()
      .then((ok) => {
        if (ok) return refreshSession();
      })
      .finally(() => {
        starting.current = false;
      });
  }, [isLoading, isConnected, session, refreshSession]);

  return {
    session,
    isLoading,
    isFreePlay: Boolean(isFreePlay && !isConnected),
    isConnected,
    ready: !isLoading && Boolean(session || getAccessToken()),
  };
}
