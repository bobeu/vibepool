"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { startFreePlaySession } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";

/**
 * Ensures a JWT session exists for API calls.
 * - Wallet connected → WalletSessionSync handles SIWE login
 * - Wallet disconnected → start guest free-play session
 *
 * Bootstrap keys off the verified session rather than a stored token: an expired
 * token would otherwise look like a valid session and 401 every request.
 */
export function useEnsureSession() {
  const { isConnected } = useAccount();
  const { session, isLoading, refreshSession, isFreePlay } = useAuth();
  const starting = useRef(false);

  useEffect(() => {
    if (isLoading || isConnected || session) return;
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
    ready: !isLoading && Boolean(session),
  };
}
