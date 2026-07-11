"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { SectionDivider } from "@/components/hero/SectionDivider";
import { Button } from "@/components/ui/button";
import { container, item } from "@/lib/motion/variants";

type ArenaHome = {
  name: string;
  season: number;
  rating: { skillRating: number; league: string; winRate: number; currentStreak: number; matchesPlayed: number };
  recentMatches: Array<{ matchId: string; outcome: string | null; opponent: string; score: number | null }>;
  friendsOnline: Array<{ username: string | null; wallet: string; status: string }>;
  queue: { status: string; matchId?: string };
};

export default function ArenaPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"home" | "queue" | "match" | "result">("home");
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [friendWallet, setFriendWallet] = useState("");
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  const { data: arenaFlag } = useQuery({
    queryKey: ["feature-flag", "arena"],
    queryFn: async () => {
      const res = await fetch("/api/feature-flags?key=arena");
      if (!res.ok) return { enabled: true };
      return res.json() as Promise<{ enabled: boolean }>;
    },
    staleTime: 30_000,
  });

  const { data, isLoading, error, refetch } = useQuery<ArenaHome>({
    queryKey: ["arena"],
    queryFn: async () => {
      const res = await fetch("/api/arena");
      if (!res.ok) throw new Error("Failed to load arena");
      return res.json();
    },
    refetchInterval: view === "queue" ? 3000 : 15000,
  });

  const { data: matchData, refetch: refetchMatch } = useQuery({
    queryKey: ["arena-match", activeMatchId],
    enabled: Boolean(activeMatchId),
    queryFn: async () => {
      const res = await fetch(`/api/arena/match?id=${activeMatchId}`);
      if (!res.ok) throw new Error("Failed to load match");
      return res.json();
    },
    refetchInterval: view === "match" ? 2000 : false,
  });

  const queueMutation = useMutation({
    mutationFn: async (mode: string) => {
      const res = await fetch("/api/arena/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, matchType: "PREDICTION_DUEL" }),
      });
      if (!res.ok) throw new Error("Queue failed");
      return res.json();
    },
    onSuccess: (result) => {
      if (result.matchId) {
        setActiveMatchId(result.matchId);
        setView("match");
      } else {
        setView("queue");
      }
      queryClient.invalidateQueries({ queryKey: ["arena"] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const res = await fetch("/api/arena/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (!res.ok) throw new Error("Accept failed");
      return res.json();
    },
    onSuccess: () => refetchMatch(),
  });

  const predictMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/arena/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: activeMatchId, prediction: Number(prediction) }),
      });
      if (!res.ok) throw new Error("Submit failed");
      return res.json();
    },
    onSuccess: (result) => {
      if (result.status === "COMPLETED") {
        setLastResult(result);
        setView("result");
      }
      refetchMatch();
      queryClient.invalidateQueries({ queryKey: ["arena"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/arena/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error("Cancel failed");
      return res.json();
    },
    onSuccess: () => {
      setView("home");
      setActiveMatchId(null);
      queryClient.invalidateQueries({ queryKey: ["arena"] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/arena/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          friendWallet ? { friendWallet } : inviteCode ? { inviteCode } : { mode: "PRIVATE_MATCH" }
        ),
      });
      if (!res.ok) throw new Error("Invite failed");
      return res.json();
    },
    onSuccess: (result) => {
      if (result.matchId) {
        setActiveMatchId(result.matchId);
        setView("match");
      }
      queryClient.invalidateQueries({ queryKey: ["arena"] });
    },
  });

  if (isLoading) {
    return (
      <AppShell activeNav="arena">
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">Loading NEXORA Arena...</div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell activeNav="arena">
        <div className="flex min-h-[50vh] items-center justify-center text-red-400">Failed to load arena</div>
      </AppShell>
    );
  }

  if (arenaFlag && !arenaFlag.enabled) {
    return (
      <AppShell activeNav="arena">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center px-4">
          <h2 className="text-xl font-bold">Arena temporarily unavailable</h2>
          <p className="text-sm text-muted-foreground max-w-md">NEXORA Arena is currently disabled for maintenance or a staged rollout. Check the Event Center for updates.</p>
          <Link href="/events" className="text-primary font-semibold text-sm">Go to Event Center</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="arena">
      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <motion.div variants={item} className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">NEXORA Arena</p>
          <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-transparent">
            Competitive Head-to-Head
          </h1>
          <p className="mt-2 text-muted-foreground">Season {data.season} · Skill-based prediction duels</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div key="home" variants={item} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <GlassContainer className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-3xl font-bold text-cyan-200">{data.rating.skillRating}</p>
                  <p className="text-sm text-violet-300">{data.rating.league}</p>
                </GlassContainer>
                <GlassContainer className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-3xl font-bold">{(data.rating.winRate * 100).toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">{data.rating.matchesPlayed} matches</p>
                </GlassContainer>
                <GlassContainer className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-3xl font-bold text-amber-300">{data.rating.currentStreak}</p>
                  <p className="text-sm text-muted-foreground">current</p>
                </GlassContainer>
              </div>

              <SectionDivider title="Play" />
              <div className="grid gap-4 md:grid-cols-2">
                <GlassContainer className="space-y-4 p-6">
                  <h2 className="text-xl font-semibold">Quick Match</h2>
                  <p className="text-sm text-muted-foreground">Find an opponent instantly with skill-based matchmaking.</p>
                  <Button onClick={() => queueMutation.mutate("QUICK_MATCH")} disabled={queueMutation.isPending}>
                    {queueMutation.isPending ? "Searching..." : "Quick Match"}
                  </Button>
                </GlassContainer>
                <GlassContainer className="space-y-4 p-6">
                  <h2 className="text-xl font-semibold">Private Match</h2>
                  <p className="text-sm text-muted-foreground">Create a room and share an invite code.</p>
                  <Button variant="secondary" onClick={() => queueMutation.mutate("PRIVATE_MATCH")} disabled={queueMutation.isPending}>
                    Create Private Room
                  </Button>
                </GlassContainer>
              </div>

              <GlassContainer className="space-y-4 p-6">
                <h2 className="text-xl font-semibold">Friend Challenge</h2>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                    placeholder="Friend wallet address"
                    value={friendWallet}
                    onChange={(e) => setFriendWallet(e.target.value)}
                  />
                  <Button onClick={() => inviteMutation.mutate()} disabled={!friendWallet || inviteMutation.isPending}>
                    Challenge
                  </Button>
                </div>
              </GlassContainer>

              <GlassContainer className="space-y-4 p-6">
                <h2 className="text-xl font-semibold">Join by Code</h2>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 uppercase"
                    placeholder="Invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                  <Button variant="secondary" onClick={() => inviteMutation.mutate()} disabled={!inviteCode}>
                    Join
                  </Button>
                </div>
              </GlassContainer>

              {data.friendsOnline.length > 0 && (
                <>
                  <SectionDivider title="Friends Online" />
                  <GlassContainer className="p-4">
                    <ul className="space-y-2">
                      {data.friendsOnline.map((f) => (
                        <li key={f.wallet} className="flex justify-between text-sm">
                          <span>{f.username ?? f.wallet.slice(0, 10)}</span>
                          <span className="text-cyan-300">{f.status}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassContainer>
                </>
              )}

              {data.recentMatches.length > 0 && (
                <>
                  <SectionDivider title="Recent Matches" />
                  <GlassContainer className="divide-y divide-white/5">
                    {data.recentMatches.map((m) => (
                      <div key={m.matchId} className="flex items-center justify-between p-4 text-sm">
                        <span>vs {m.opponent ?? "Unknown"}</span>
                        <span className={m.outcome === "WIN" ? "text-green-400" : m.outcome === "LOSS" ? "text-red-400" : "text-muted-foreground"}>
                          {m.outcome ?? "—"} {m.score != null ? `(${m.score.toFixed?.(1) ?? m.score}%)` : ""}
                        </span>
                        <Link href={`/arena/replay?id=${m.matchId}`} className="text-cyan-300 hover:underline">
                          Replay
                        </Link>
                      </div>
                    ))}
                  </GlassContainer>
                </>
              )}
            </motion.div>
          )}

          {view === "queue" && (
            <motion.div key="queue" variants={item} className="text-center">
              <GlassContainer className="space-y-6 p-10">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="mx-auto h-16 w-16 rounded-full border-2 border-cyan-400/50"
                />
                <h2 className="text-2xl font-semibold">Searching for opponent...</h2>
                <p className="text-muted-foreground">Status: {data.queue?.status ?? "SEARCHING"}</p>
                <Button variant="destructive" onClick={() => cancelMutation.mutate()}>Cancel</Button>
              </GlassContainer>
            </motion.div>
          )}

          {view === "match" && matchData && (
            <motion.div key="match" variants={item} className="space-y-6">
              <GlassContainer className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Match · {matchData.status}</h2>
                  <Button variant="ghost" size="sm" onClick={() => { setView("home"); setActiveMatchId(null); refetch(); }}>
                    Exit
                  </Button>
                </div>

                {matchData.status === "WAITING" && (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">Waiting for all players to accept.</p>
                    {matchData.inviteCode && (
                      <p className="rounded-lg bg-black/40 p-3 font-mono text-cyan-300">Invite: {matchData.inviteCode}</p>
                    )}
                    <Button onClick={() => acceptMutation.mutate(matchData.id)}>Accept Match</Button>
                  </div>
                )}

                {matchData.status === "COUNTDOWN" && (
                  <motion.p
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: 3, duration: 1 }}
                    className="text-center text-4xl font-bold text-amber-300"
                  >
                    3... 2... 1...
                  </motion.p>
                )}

                {matchData.status === "PLAYING" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Submit your prediction for the prediction duel.</p>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                      placeholder="Your prediction (e.g. 5000)"
                      value={prediction}
                      onChange={(e) => setPrediction(e.target.value)}
                    />
                    <Button onClick={() => predictMutation.mutate()} disabled={!prediction || predictMutation.isPending}>
                      Submit Prediction
                    </Button>
                  </div>
                )}

                <div className="grid gap-2">
                  {(matchData.participants ?? []).map((p: { wallet: string; username: string | null; accepted: boolean; prediction: number | null }) => (
                    <div key={p.wallet} className="flex justify-between rounded-lg bg-black/20 px-3 py-2 text-sm">
                      <span>{p.username ?? p.wallet.slice(0, 10)}</span>
                      <span>{p.accepted ? "Ready" : "Waiting"} · {p.prediction != null ? `Pred: ${p.prediction}` : "—"}</span>
                    </div>
                  ))}
                </div>
              </GlassContainer>
            </motion.div>
          )}

          {view === "result" && lastResult && (
            <motion.div key="result" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <GlassContainer className="space-y-6 p-10">
                <motion.h2
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className={`text-3xl font-bold ${lastResult.isDraw ? "text-amber-300" : "text-green-400"}`}
                >
                  {lastResult.isDraw ? "Draw" : "Match Complete"}
                </motion.h2>
                <Button onClick={() => { setView("home"); setLastResult(null); setActiveMatchId(null); refetch(); }}>
                  Back to Arena
                </Button>
                {activeMatchId && (
                  <Link href={`/arena/replay?id=${activeMatchId}`} className="block text-cyan-300 hover:underline">
                    View Replay
                  </Link>
                )}
              </GlassContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppShell>
  );
}
