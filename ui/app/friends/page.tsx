"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { SectionDivider } from "@/components/hero/SectionDivider";
import { Button } from "@/components/ui/button";
import { container, item } from "@/lib/motion/variants";

type Friend = { id: string; wallet: string; username: string | null; level: number; xp: number };
type Pending = { id: string; wallet: string; username: string | null; message: string | null; createdAt: string };

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"friends" | "requests" | "add">("friends");
  const [targetWallet, setTargetWallet] = useState("");
  const [message, setMessage] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await fetch("/api/friends");
      if (!res.ok) throw new Error("Failed to load friends");
      return res.json();
    },
    staleTime: 15_000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: targetWallet, message }),
      });
      if (!res.ok) throw new Error("Failed to send request");
      return res.json();
    },
    onSuccess: () => {
      setTargetWallet("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, accept }),
      });
      if (!res.ok) throw new Error("Failed to respond");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (friendWallet: string) => {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendWallet }),
      });
      if (!res.ok) throw new Error("Failed to remove friend");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });

  const blockMutation = useMutation({
    mutationFn: async (friendWallet: string) => {
      const res = await fetch("/api/friends/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetWallet: friendWallet }),
      });
      if (!res.ok) throw new Error("Failed to block");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });

  const friends: Friend[] = data?.friends ?? [];
  const pending: { incoming: Pending[]; outgoing: Pending[] } = data?.pending ?? { incoming: [], outgoing: [] };

  const tabs: { key: typeof tab; label: string; count?: number }[] = [
    { key: "friends", label: "Friends", count: friends.length },
    { key: "requests", label: "Requests", count: pending.incoming.length + pending.outgoing.length },
    { key: "add", label: "Add" },
  ];

  return (
    <AppShell activeNav="friends">
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        <motion.section variants={item} className="flex items-center justify-between">
          <h1 className="text-xl font-black uppercase tracking-tight">Friends</h1>
        </motion.section>

        <motion.section variants={item} className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {t.label}
              {t.count ? ` (${t.count})` : ""}
            </button>
          ))}
        </motion.section>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <GlassContainer>
            <p className="text-sm text-destructive text-center py-6">Failed to load friends.</p>
          </GlassContainer>
        )}

        {tab === "friends" && !isLoading && (
          <motion.section variants={item} className="space-y-3">
            <SectionDivider label="Your Friends" />
            {friends.length === 0 ? (
              <GlassContainer>
                <p className="text-sm text-muted-foreground text-center py-6">No friends yet. Add one above!</p>
              </GlassContainer>
            ) : (
              friends.map((f) => (
                <GlassContainer key={f.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{f.username ?? `${f.wallet.slice(0, 6)}…${f.wallet.slice(-4)}`}</p>
                    <p className="text-xs text-muted-foreground">Lvl {f.level} · {f.xp?.toLocaleString()} XP</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="neobrutal-card"
                      onClick={() => removeMutation.mutate(f.wallet)}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      className="neobrutal-card text-destructive"
                      onClick={() => blockMutation.mutate(f.wallet)}
                    >
                      Block
                    </Button>
                  </div>
                </GlassContainer>
              ))
            )}
          </motion.section>
        )}

        {tab === "requests" && !isLoading && (
          <motion.section variants={item} className="space-y-3">
            <SectionDivider label="Incoming" />
            {pending.incoming.length === 0 ? (
              <GlassContainer><p className="text-sm text-muted-foreground text-center py-6">No incoming requests.</p></GlassContainer>
            ) : (
              pending.incoming.map((r) => (
                <GlassContainer key={r.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm">{r.username ?? `${r.wallet.slice(0, 6)}…${r.wallet.slice(-4)}`}</p>
                    {r.message && <p className="text-xs text-muted-foreground">{r.message}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button className="neobrutal-card" onClick={() => respondMutation.mutate({ requestId: r.id, accept: true })}>Accept</Button>
                    <Button variant="outline" className="neobrutal-card" onClick={() => respondMutation.mutate({ requestId: r.id, accept: false })}>Reject</Button>
                  </div>
                </GlassContainer>
              ))
            )}
            <SectionDivider label="Outgoing" />
            {pending.outgoing.length === 0 ? (
              <GlassContainer><p className="text-sm text-muted-foreground text-center py-6">No pending sent requests.</p></GlassContainer>
            ) : (
              pending.outgoing.map((r) => (
                <GlassContainer key={r.id} className="p-4">
                  <p className="font-bold text-sm">{r.username ?? `${r.wallet.slice(0, 6)}…${r.wallet.slice(-4)}`}</p>
                  <p className="text-xs text-muted-foreground">Request sent</p>
                </GlassContainer>
              ))
            )}
          </motion.section>
        )}

        {tab === "add" && (
          <motion.section variants={item} className="space-y-3">
            <SectionDivider label="Send Friend Request" />
            <GlassContainer className="p-4 space-y-3">
              <input
                value={targetWallet}
                onChange={(e) => setTargetWallet(e.target.value)}
                placeholder="Friend wallet address (0x…)"
                className="w-full rounded-xl border border-border/50 bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message (optional)"
                className="w-full rounded-xl border border-border/50 bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <Button
                className="neobrutal-card"
                disabled={!targetWallet || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
              >
                {sendMutation.isPending ? "Sending…" : "Send Request"}
              </Button>
              {sendMutation.isError && <p className="text-xs text-destructive">Could not send request.</p>}
            </GlassContainer>
          </motion.section>
        )}
      </motion.div>
    </AppShell>
  );
}
