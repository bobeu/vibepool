"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { SectionDivider } from "@/components/hero/SectionDivider";
import { Button } from "@/components/ui/button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { authFetch } from "@/lib/auth/client";
import { container, item } from "@/lib/motion/variants";
import { useSkillBoostPayment } from "@/hooks/useSkillBoostPayment";
import { useUIStore } from "@/store/uiStore";

type ArenaHome = {
  name: string;
  season: number;
  rating: {
    skillRating: number;
    league: string;
    winRate: number;
    currentStreak: number;
    matchesPlayed: number;
  };
  recentMatches: Array<{
    matchId: string;
    outcome: string | null;
    opponent: string;
    score: number | null;
  }>;
  friendsOnline: Array<{ username: string | null; wallet: string; status: string }>;
  queue: { status: string; matchId?: string };
  skillBoost?: {
    stayRelevant: boolean;
    stayRelevantUntil?: string | null;
    unusedBoosts: number;
    xpMultiplier: number;
    pointsMultiplier: number;
    fees: { cUSD: string; CELO: string };
  };
};

export default function ArenaPage() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [view, setView] = useState<"home" | "queue" | "match" | "result">("home");
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [friendWallet, setFriendWallet] = useState("");
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const {
    paySkillBoost,
    busy: boostBusy,
    preferredAsset,
    feeLabel,
    miniPay,
    isConnected,
  } = useSkillBoostPayment();

  const { data: arenaFlag } = useQuery({
    queryKey: ["feature-flag", "arena"],
    queryFn: async () => {
      const res = await authFetch("/api/feature-flags?key=arena");
      if (!res.ok) return { enabled: true };
      return res.json() as Promise<{ enabled: boolean }>;
    },
    staleTime: 60_000,
  });

  const { data, isLoading, error, refetch } = useQuery<ArenaHome>({
    queryKey: ["arena"],
    queryFn: async () => {
      const res = await authFetch("/api/arena");
      if (!res.ok) throw new Error("Failed to load arena");
      return res.json();
    },
    // Poll aggressively only while searching; otherwise soft refresh.
    refetchInterval: view === "queue" ? 4_000 : false,
    refetchOnWindowFocus: view === "home",
    staleTime: 20_000,
  });

  // Auto-enter match when queue finds one
  useEffect(() => {
    if (view !== "queue") return;
    const matchId = data?.queue?.matchId;
    if (matchId) {
      setActiveMatchId(matchId);
      setView("match");
    }
  }, [data?.queue?.matchId, view]);

  const { data: matchData, refetch: refetchMatch } = useQuery({
    queryKey: ["arena-match", activeMatchId],
    enabled: Boolean(activeMatchId),
    queryFn: async () => {
      const res = await authFetch(`/api/arena/match?id=${activeMatchId}`);
      if (!res.ok) throw new Error("Failed to load match");
      return res.json();
    },
    refetchInterval: view === "match" ? 2_500 : false,
  });

  // Client-side countdown when server jumps WAITING → PLAYING
  useEffect(() => {
    if (view !== "match" || !matchData) return;
    if (matchData.status === "COUNTDOWN" || (matchData.status === "PLAYING" && countdown === null && !prediction)) {
      // Show a short local countdown once when entering play
      if (matchData.status === "PLAYING" && countdown === null) {
        setCountdown(3);
      }
    }
  }, [matchData?.status, view]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (countdown == null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => (c == null ? null : c - 1)), 700);
    return () => clearTimeout(t);
  }, [countdown]);

  const queueMutation = useMutation({
    mutationFn: async (mode: string) => {
      const res = await authFetch("/api/arena/queue", {
        method: "POST",
        body: JSON.stringify({ mode, matchType: "PREDICTION_DUEL" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Queue failed");
      }
      return res.json();
    },
    onSuccess: (result) => {
      if (result.matchId) {
        setActiveMatchId(result.matchId);
        setCountdown(null);
        setView("match");
      } else {
        setView("queue");
      }
      queryClient.invalidateQueries({ queryKey: ["arena"] });
    },
    onError: (e: Error) => showToast(e.message),
  });

  const acceptMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const res = await authFetch("/api/arena/accept", {
        method: "POST",
        body: JSON.stringify({ matchId }),
      });
      if (!res.ok) throw new Error("Accept failed");
      return res.json();
    },
    onSuccess: () => {
      setCountdown(3);
      refetchMatch();
    },
  });

  const predictMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/arena/match", {
        method: "POST",
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
      const res = await authFetch("/api/arena/cancel", { method: "POST", body: "{}" });
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
      const res = await authFetch("/api/arena/invite", {
        method: "POST",
        body: JSON.stringify(
          friendWallet ? { friendWallet } : inviteCode ? { inviteCode } : { mode: "PRIVATE_MATCH" }
        ),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Invite failed");
      }
      return res.json();
    },
    onSuccess: (result) => {
      if (result.matchId) {
        setActiveMatchId(result.matchId);
        setView("match");
      }
      if (result.invitationCode || result.inviteCode) {
        showToast(`Code: ${result.invitationCode || result.inviteCode}`);
      }
      queryClient.invalidateQueries({ queryKey: ["arena"] });
    },
    onError: (e: Error) => showToast(e.message),
  });

  const rematchMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/arena/invite", {
        method: "POST",
        body: JSON.stringify({ rematchOf: activeMatchId }),
      });
      if (!res.ok) throw new Error("Rematch failed");
      return res.json();
    },
    onSuccess: (result) => {
      if (result.matchId) {
        setLastResult(null);
        setPrediction("");
        setCountdown(null);
        setActiveMatchId(result.matchId);
        setView("match");
      }
      queryClient.invalidateQueries({ queryKey: ["arena"] });
    },
  });

  const onBoost = async (purpose: "ARENA_BOOST" | "STAY_RELEVANT" | "POINTS_GROWTH") => {
    try {
      const result = await paySkillBoost(purpose, activeMatchId ?? undefined);
      showToast(
        purpose === "POINTS_GROWTH"
          ? `+${result.pointsGranted ?? 40} points · fee to treasury`
          : purpose === "STAY_RELEVANT"
            ? "Relevant for 24h · fee to treasury"
            : "2× XP ready for next duel"
      );
      queryClient.invalidateQueries({ queryKey: ["arena"] });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Payment failed");
    }
  };

  if (isLoading) {
    return (
      <AppShell activeNav="arena">
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Loading Nexora Arena...
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell activeNav="arena">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-red-400">
          <p>Failed to load arena</p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </AppShell>
    );
  }

  if (arenaFlag && !arenaFlag.enabled) {
    return (
      <AppShell activeNav="arena">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <h2 className="text-xl font-bold">Arena temporarily unavailable</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Nexora Arena is currently disabled for maintenance or a staged rollout.
          </p>
          <Link href="/events" className="text-sm font-semibold text-primary">
            Go to Event Center
          </Link>
        </div>
      </AppShell>
    );
  }

  const streak = data.rating.currentStreak ?? 0;
  const boost = data.skillBoost;

  return (
    <AppShell activeNav="arena">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-5xl space-y-8 px-4 py-8"
      >
        <motion.div variants={item} className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Nexora Arena</p>
          <h1 className="mt-2 bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-4xl font-bold text-transparent">
            Pulse Lock Duels
          </h1>
          <p className="mt-2 text-muted-foreground">
            Season {data.season} · Skill-based · No betting
          </p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#FBBF24]">
            Lock the pulse closer than your rival · win XP & streaks
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              variants={item}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <BrutalCard className="relative overflow-hidden p-0">
                <div className="relative h-48 w-full border-b-[3px] border-black bg-black">
                  <Image
                    src="/arena.png"
                    alt="Nexora Arena"
                    fill
                    className="animate-fade-in object-cover opacity-90"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <p className="brutal-heading text-xl text-white drop-shadow-[2px_2px_0_#000]">
                      Pulse Lock
                    </p>
                    <p className="mt-1 max-w-xs text-[10px] font-bold text-white/95 drop-shadow-[1px_1px_0_#000]">
                      Read the band. Lock your number. Chain the streak.
                    </p>
                  </div>
                </div>
              </BrutalCard>

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
                  <motion.p
                    key={streak}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-amber-300"
                  >
                    {streak}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">
                    {streak >= 3 ? "On fire — bonus XP active" : "current"}
                  </p>
                </GlassContainer>
              </div>

              <SectionDivider label="On-chain skill fees" />
              <GlassContainer clip={false} className="space-y-3 p-5">
                <p className="text-sm text-muted-foreground">
                  Tiny treasury fees — not bets.{" "}
                  {miniPay ? "MiniPay pays in cUSD." : "Desktop wallets pay in CELO."} Fee:{" "}
                  <span className="font-semibold text-cyan-200">{feeLabel}</span>
                </p>
                <div className="grid gap-2">
                  <Button
                    className="w-full"
                    disabled={!isConnected || boostBusy}
                    onClick={() => onBoost("ARENA_BOOST")}
                  >
                    {boostBusy ? "Confirm in wallet…" : `Boost next duel · 2× XP (${feeLabel})`}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={!isConnected || boostBusy}
                    onClick={() => onBoost("STAY_RELEVANT")}
                  >
                    Stay Relevant 24h ({feeLabel})
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!isConnected || boostBusy}
                    onClick={() => onBoost("POINTS_GROWTH")}
                  >
                    Grow points +40 ({feeLabel})
                  </Button>
                </div>
                {boost && (
                  <p className="text-[11px] text-muted-foreground">
                    {boost.stayRelevant ? "● Relevant active · " : ""}
                    {boost.unusedBoosts > 0
                      ? `${boost.unusedBoosts} unused duel boost(s) · `
                      : ""}
                    Multipliers {boost.xpMultiplier}× XP / {boost.pointsMultiplier}× pts
                    {preferredAsset === "cUSD" ? " · cUSD path" : " · CELO path"}
                  </p>
                )}
                {!isConnected && (
                  <p className="text-[11px] text-amber-300">
                    Connect MiniPay / Celo wallet for on-chain fees. Practice duels stay free.
                  </p>
                )}
              </GlassContainer>

              <SectionDivider label="Play" />
              <div className="grid gap-4 md:grid-cols-2">
                <GlassContainer className="space-y-4 p-6">
                  <h2 className="text-xl font-semibold">Quick Pulse</h2>
                  <p className="text-sm text-muted-foreground">
                    Instant skill duel vs practice bot or a matched rival. Free to play.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => queueMutation.mutate("QUICK_MATCH")}
                    disabled={queueMutation.isPending}
                  >
                    {queueMutation.isPending ? "Locking in…" : "Quick Pulse"}
                  </Button>
                </GlassContainer>
                <GlassContainer className="space-y-4 p-6">
                  <h2 className="text-xl font-semibold">Private Room</h2>
                  <p className="text-sm text-muted-foreground">
                    Create a room and share an invite code.
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => queueMutation.mutate("PRIVATE_MATCH")}
                    disabled={queueMutation.isPending}
                  >
                    Create Private Room
                  </Button>
                </GlassContainer>
              </div>

              <GlassContainer clip={false} className="space-y-4 p-6">
                <h2 className="text-xl font-semibold">Friend Challenge</h2>
                <div className="flex w-full min-w-0 flex-col gap-3">
                  <input
                    className="w-full min-w-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                    placeholder="Friend wallet address"
                    value={friendWallet}
                    onChange={(e) => setFriendWallet(e.target.value)}
                  />
                  <Button
                    className="w-full shrink-0"
                    onClick={() => inviteMutation.mutate()}
                    disabled={!friendWallet || inviteMutation.isPending}
                  >
                    Challenge
                  </Button>
                </div>
              </GlassContainer>

              <GlassContainer clip={false} className="space-y-4 p-6">
                <h2 className="text-xl font-semibold">Join by Code</h2>
                <div className="flex w-full min-w-0 flex-col gap-3">
                  <input
                    className="w-full min-w-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2 uppercase"
                    placeholder="Invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    className="w-full shrink-0"
                    onClick={() => inviteMutation.mutate()}
                    disabled={!inviteCode || inviteMutation.isPending}
                  >
                    Join
                  </Button>
                </div>
              </GlassContainer>

              {data.friendsOnline.length > 0 && (
                <>
                  <SectionDivider label="Friends Online" />
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
                  <SectionDivider label="Recent Matches" />
                  <GlassContainer className="divide-y divide-white/5">
                    {data.recentMatches.map((m) => (
                      <div
                        key={m.matchId}
                        className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"
                      >
                        <span>vs {m.opponent ?? "Unknown"}</span>
                        <span
                          className={
                            m.outcome === "WIN"
                              ? "text-green-400"
                              : m.outcome === "LOSS"
                                ? "text-red-400"
                                : "text-muted-foreground"
                          }
                        >
                          {m.outcome ?? "—"}{" "}
                          {m.score != null ? `(${m.score.toFixed?.(1) ?? m.score}%)` : ""}
                        </span>
                        <Link
                          href={`/arena/replay?id=${m.matchId}`}
                          className="text-cyan-300 hover:underline"
                        >
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
                <Button variant="outline" onClick={() => cancelMutation.mutate()}>
                  Cancel
                </Button>
              </GlassContainer>
            </motion.div>
          )}

          {view === "match" && matchData && (
            <motion.div key="match" variants={item} className="space-y-6">
              <GlassContainer clip={false} className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold">Pulse Lock · {matchData.status}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setView("home");
                      setActiveMatchId(null);
                      refetch();
                    }}
                  >
                    Exit
                  </Button>
                </div>

                {matchData.status === "WAITING" && (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">Waiting for all players to accept.</p>
                    {matchData.inviteCode && (
                      <p className="rounded-lg bg-black/40 p-3 font-mono text-cyan-300">
                        Invite: {matchData.inviteCode}
                      </p>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => acceptMutation.mutate(matchData.id)}
                      disabled={acceptMutation.isPending}
                    >
                      Accept Match
                    </Button>
                  </div>
                )}

                {(countdown != null && countdown > 0) && (
                  <motion.p
                    key={countdown}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center text-5xl font-black text-amber-300"
                  >
                    {countdown}
                  </motion.p>
                )}

                {matchData.status === "PLAYING" && (countdown == null || countdown <= 0) && (
                  <div className="space-y-4">
                    {matchData.pulseBand && (
                      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                          Pulse band
                        </p>
                        <p className="mt-1 text-lg font-bold text-white">
                          {matchData.pulseBand.low} — {matchData.pulseBand.high}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Lock a number inside the band. Closest to the hidden pulse wins.
                        </p>
                      </div>
                    )}
                    <input
                      type="number"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                      placeholder="Lock your pulse"
                      value={prediction}
                      onChange={(e) => setPrediction(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      onClick={() => predictMutation.mutate()}
                      disabled={!prediction || predictMutation.isPending}
                    >
                      Lock Pulse
                    </Button>
                    {isConnected && (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={boostBusy}
                        onClick={() => onBoost("ARENA_BOOST")}
                      >
                        Boost this duel 2× ({feeLabel})
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  {(matchData.participants ?? []).map(
                    (p: {
                      wallet: string;
                      username: string | null;
                      accepted: boolean;
                      prediction: number | null;
                    }) => (
                      <div
                        key={p.wallet}
                        className="flex justify-between rounded-lg bg-black/20 px-3 py-2 text-sm"
                      >
                        <span>{p.username ?? p.wallet.slice(0, 10)}</span>
                        <span>
                          {p.accepted ? "Ready" : "Waiting"} ·{" "}
                          {p.prediction === -1
                            ? "Locked"
                            : p.prediction != null
                              ? `Pred: ${p.prediction}`
                              : "—"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </GlassContainer>
            </motion.div>
          )}

          {view === "result" && lastResult && (
            <motion.div
              key="result"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <GlassContainer className="space-y-6 p-10">
                <motion.h2
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className={`text-3xl font-bold ${lastResult.isDraw ? "text-amber-300" : "text-green-400"}`}
                >
                  {lastResult.isDraw ? "Draw" : "Pulse Locked"}
                </motion.h2>
                <p className="text-sm text-muted-foreground">
                  Chain another duel to keep your streak hot.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => rematchMutation.mutate()}
                    disabled={rematchMutation.isPending || !activeMatchId}
                  >
                    Rematch
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setView("home");
                      setLastResult(null);
                      setActiveMatchId(null);
                      setPrediction("");
                      refetch();
                    }}
                  >
                    Back to Arena
                  </Button>
                  {activeMatchId && (
                    <Link
                      href={`/arena/replay?id=${activeMatchId}`}
                      className="block text-cyan-300 hover:underline"
                    >
                      View Replay
                    </Link>
                  )}
                </div>
              </GlassContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppShell>
  );
}
