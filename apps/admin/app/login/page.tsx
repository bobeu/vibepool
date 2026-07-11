"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken, checkAdminAuth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [token, setTokenInput] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setToken(token.trim());
    try {
      const auth = await checkAdminAuth();
      if (!auth.authorized) {
        setError("Wallet is not authorized for admin access.");
        return;
      }
      router.push("/");
    } catch {
      setError("Invalid session token.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="admin-card w-full max-w-md space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-bold">NEXORA</p>
          <h1 className="text-2xl font-black">Operations Console</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in with an admin wallet session token from the player API login.
          </p>
        </div>
        <label className="block text-sm">
          Access Token
          <input
            className="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
            value={token}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste Bearer token"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded-lg bg-primary py-2 font-bold text-sm">
          Enter Console
        </button>
      </form>
    </div>
  );
}
