"use client";

import { useAccount, useSignMessage } from "wagmi";
import { useEffect, useRef } from "react";
import { clearTokens, getAccessToken, isFreePlaySession, setTokens } from "@/lib/auth/client";

export function WalletSessionSync() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const syncing = useRef(false);

  useEffect(() => {
    if (!isConnected || !address) {
      // Keep free-play guest sessions when no wallet is connected.
      if (!isFreePlaySession()) {
        clearTokens();
        window.dispatchEvent(new Event("nexora:session"));
      }
      return;
    }

    // Upgrade from free-play guest → real wallet when user connects.
    if (getAccessToken() && !isFreePlaySession()) return;
    if (syncing.current) return;

    syncing.current = true;
    (async () => {
      try {
        const timestamp = Date.now();
        const wallet = address.toLowerCase();
        const message = `Sign in to NEXORA\nWallet: ${wallet}\nTimestamp: ${timestamp}`;
        const signature = await signMessageAsync({ message });
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet, signature, message, timestamp }),
        });
        if (res.ok) {
          const data = await res.json();
          // Clear guest flag when a real wallet session is established.
          localStorage.removeItem("nexora_free_play");
          setTokens(data.accessToken, data.refreshToken);
          window.dispatchEvent(new Event("nexora:session"));
        }
      } catch {
        /* user rejected signature */
      } finally {
        syncing.current = false;
      }
    })();
  }, [isConnected, address, signMessageAsync]);

  return null;
}
