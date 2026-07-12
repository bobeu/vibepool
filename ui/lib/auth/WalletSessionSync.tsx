"use client";

import { useAccount, useSignMessage } from "wagmi";
import { useEffect, useRef } from "react";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth/client";

export function WalletSessionSync() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const syncing = useRef(false);

  useEffect(() => {
    if (!isConnected || !address) {
      clearTokens();
      window.dispatchEvent(new Event("nexora:session"));
      return;
    }

    if (getAccessToken() || syncing.current) return;

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
          body: JSON.stringify({ wallet: address, signature, message, timestamp }),
        });
        if (res.ok) {
          const data = await res.json();
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
