"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/utils/format";
import { Trophy, Users, Calendar, Clock, Crown, Star } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "global" | "friends" | "season";

interface LBEntry {
  userId?: string;
  wallet?: string;
  user?: { username?: string | null; avatar?: string | null };
  xp: number;
  spins?: number;
  points?: number;
  rank?: number;
  isSpinner?: boolean;
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function useCountdown(targetDate: Date) {
  const [diff, setDiff] = useState(() => Math.max(0, targetDate.getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, targetDate.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { h, m, s };
}

function SeasonCountdown() {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  const { h, m, s } = useCountdown(endOfMonth);
  const total = endOfMonth.getTime() - new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const elapsed = Date.now() - new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const pct = Math.round((elapsed / total) * 100);

  return (
    <div className="brutal-card-yellow px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <p className="text-[10px] font-black uppercase tracking-widest">Season Ends In</p>
        </div>
        <div className="flex items-center gap-1 tabular-nums text-sm font-black">
          <span className="px-1.5 py-0.5 bg-black text-secondary border border-black text-xs">{String(h).padStart(2,"0")}h</span>
          <span className="font-black">:</span>
          <span className="px-1.5 py-0.5 bg-black text-secondary border border-black text-xs">{String(m).padStart(2,"0")}m</span>
          <span className="font-black">:</span>
          <span className="px-1.5 py-0.5 bg-black text-secondary border border-black text-xs">{String(s).padStart(2,"0")}s</span>
        </div>
      </div>
      <div className="h-2 bg-black/20 border-[1.5px] border-black">
        <div className="h-full bg-black transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Podium ───────────────────────────────────────────────────────────────────

const MEDAL_STYLES = [
  // index 0 → 1st place (tallest, center)
  { label: "#1", bg: "bg-secondary", shadow: "shadow-[3px_3px_0_#B8960A]", barHeight: "h-20", textColor: "text-black" },
  // index 1 → 2nd place (left)
  { label: "#2", bg: "bg-zinc-200", shadow: "shadow-[3px_3px_0_#888]", barHeight: "h-14", textColor: "text-black" },
  // index 2 → 3rd place (right)
  { label: "#3", bg: "bg-amber-600", shadow: "shadow-[3px_3px_0_#7C4910]", barHeight: "h-12", textColor: "text-white" },
] as const;

/** Renders a real entry's podium card */
function PodiumCard({ entry, placeIndex }: { entry: LBEntry; placeIndex: 0 | 1 | 2 }) {
  const m = MEDAL_STYLES[placeIndex];
  const name = entry.user?.username ?? "Player";
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* Avatar */}
      <div
        className={cn(
          "w-11 h-11 flex-shrink-0 flex items-center justify-center border-[3px] border-black font-black text-base",
          m.bg,
          m.shadow
        )}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
      {/* Name */}
      <p className="text-[9px] font-black uppercase text-center leading-none w-full truncate px-1">
        {name}
      </p>
      {/* XP */}
      <p className="text-[9px] font-bold text-muted-foreground tabular-nums">
        {(entry.xp ?? 0).toLocaleString()} XP
      </p>
      {/* Platform bar */}
      <div
        className={cn(
          "w-full border-[2.5px] border-black flex items-center justify-center font-black text-xs py-1",
          m.bg,
          m.textColor,
          m.barHeight
        )}
      >
        {m.label}
      </div>
    </div>
  );
}

/** Renders a placeholder card for an empty podium slot */
function PodiumPlaceholder({ placeIndex }: { placeIndex: 0 | 1 | 2 }) {
  const m = MEDAL_STYLES[placeIndex];
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* Empty avatar */}
      <div className="w-11 h-11 flex-shrink-0 rounded-full border-[2.5px] border-dashed border-zinc-300 bg-zinc-100/50 flex items-center justify-center text-[10px] font-black text-zinc-400">
        ?
      </div>
      <p className="text-[9px] font-black uppercase text-center text-zinc-400 leading-none">
        Empty
      </p>
      <p className="text-[9px] font-bold text-zinc-400">— XP</p>
      {/* Platform bar */}
      <div
        className={cn(
          "w-full border-[2.5px] border-dashed border-zinc-300 flex items-center justify-center font-black text-xs py-1 text-zinc-400",
          m.barHeight
        )}
      >
        {m.label}
      </div>
    </div>
  );
}

// ─── Leaderboard Page ─────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("global");
  const { address } = useAccount();

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const entries: LBEntry[] = data?.leaderboard ?? [];

  // Find current user's rank
  const myEntry = address
    ? entries.find((e) => (e as LBEntry & { wallet?: string }).wallet?.toLowerCase() === address.toLowerCase())
    : null;
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : null;

  const TABS = [
    { id: "global" as TabId, label: "Global", icon: Trophy },
    { id: "friends" as TabId, label: "Friends", icon: Users },
    { id: "season" as TabId, label: "Season", icon: Calendar },
  ];

  if (isLoading) {
    return (
      <AppShell activeNav="leaderboard">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse border-[2px] border-black" />
          ))}
        </div>
      </AppShell>
    );
  }

  // Map entries to podium slots: slot 0 = 1st, 1 = 2nd, 2 = 3rd
  // Podium display order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder: (0 | 1 | 2)[] = [1, 0, 2];

  return (
    <AppShell activeNav="leaderboard">
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" strokeWidth={2.5} />
          <h1 className="text-xl font-black uppercase tracking-tight">Leaderboard</h1>
        </div>

        {/* Leaderboard Cover Card */}
        <div className="relative rounded-2xl overflow-hidden border-4 border-black h-44 shadow-[4px_4px_0_rgba(0,0,0,1)]">
          <Image
            src="/leaderboard.png"
            alt="Leaderboard"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 bg-[#FBBF24] text-black font-black text-[9px] uppercase px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <Star className="w-3 h-3" strokeWidth={2.5} />
              Season 1 Active
            </span>
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <p className="font-black uppercase italic text-white text-xl leading-tight drop-shadow-[2px_2px_0_#000]">
              Nexora<br />Championship
            </p>
            <p className="text-[10px] text-white/80 font-bold mt-0.5">
              Predict. Spin. Dominate the Arena.
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex rounded-2xl overflow-hidden border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase transition-all border-r-4 border-black last:border-r-0",
                  activeTab === tab.id
                    ? "bg-black text-primary"
                    : "bg-white text-black hover:bg-zinc-100"
                )}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Season countdown ── */}
        {activeTab === "season" && <SeasonCountdown />}

        {/* ── Podium (top 3) — always shown, placeholders when < 3 entries ── */}
        <div className="brutal-card p-4">
          <div className="flex items-end gap-2 w-full">
            {podiumOrder.map((placeIndex) => {
              const entry = entries[placeIndex];
              return entry ? (
                <PodiumCard key={placeIndex} entry={entry} placeIndex={placeIndex} />
              ) : (
                <PodiumPlaceholder key={placeIndex} placeIndex={placeIndex} />
              );
            })}
          </div>
        </div>

        {/* ── Rest of leaderboard (4th and below) ── */}
        {entries.length > 3 && (
          <div className="brutal-card divide-y-[2px] divide-black">
            {entries.slice(3).map((entry, idx) => {
              const rank = idx + 4;
              const isMe = address && (entry as LBEntry & { wallet?: string }).wallet?.toLowerCase() === address.toLowerCase();
              return (
                <div
                  key={(entry as LBEntry & { userId?: string }).userId ?? idx}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5",
                    isMe && "bg-primary/10"
                  )}
                >
                  <span className="w-6 text-center text-xs font-black text-muted-foreground tabular-nums shrink-0">
                    #{rank}
                  </span>
                  <div className="w-8 h-8 flex-shrink-0 border-[2px] border-black bg-muted flex items-center justify-center text-[10px] font-black uppercase">
                    {(entry.user?.username ?? "P").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xs truncate">
                      {entry.user?.username ?? "Player"}
                      {isMe && (
                        <span className="ml-1 text-[9px] bg-primary text-black px-1 border border-black">
                          You
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-secondary" />
                      <p className="text-xs font-black tabular-nums">
                        {(entry.xp ?? 0).toLocaleString()} XP
                      </p>
                    </div>
                    {(entry.spins ?? 0) > 0 || entry.isSpinner ? (
                      <p className="text-[9px] font-bold uppercase text-primary">
                        Spinner · {entry.spins ?? 0}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {entries.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10 font-medium">
            No rankings yet. Be the first!
          </p>
        )}
      </div>

      {/* ── Sticky Current User Bar ── */}
      {myEntry && myRank && (
        <div className="fixed bottom-[84px] left-0 right-0 z-30 px-4 md:relative md:bottom-0 md:left-auto md:right-auto md:px-0 md:mt-4">
          <div className="bg-secondary border-[3px] border-black shadow-[4px_4px_0_#000] px-4 py-3 flex items-center justify-between gap-3">
            <div className="w-9 h-9 flex-shrink-0 border-[2.5px] border-black bg-black text-secondary flex items-center justify-center text-sm font-black">
              #{myRank}
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-black text-xs uppercase truncate">Your Rank</p>
              <p className="text-[10px] text-black/70">{(myEntry.xp ?? 0).toLocaleString()} XP</p>
            </div>
            <Trophy className="w-5 h-5 flex-shrink-0 animate-bounce" />
          </div>
        </div>
      )}
    </AppShell>
  );
}
