"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { container, item } from "@/lib/motion/variants";

type SeasonData = {
  active: {
    number: number;
    name: string;
    description?: string;
    status: string;
    startAt?: string;
    endAt?: string;
    tiers?: Array<{ tierLevel: number; name: string; xpRequired: number }>;
    rewards?: Array<{ id: string; name: string; tierLevel: number }>;
  };
  progress: {
    seasonXp: number;
    tierLevel: number;
    seasonRank?: number;
    matchesPlayed?: number;
  } | null;
};

export default function SeasonPage() {
  const { data, isLoading, error } = useQuery<SeasonData>({
    queryKey: ["season"],
    queryFn: async () => {
      const res = await fetch("/api/seasons");
      if (!res.ok) throw new Error("Failed to load season");
      return res.json();
    },
    staleTime: 15_000,
  });

  const season = data?.active;
  const progress = data?.progress;

  return (
    <AppShell activeNav="season">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <h1 className="text-2xl font-black uppercase tracking-tight">Season Pass</h1>
          <p className="text-sm text-muted-foreground mt-1">Earn season XP from arena matches and events.</p>
        </motion.div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading season...</p>}
        {error && <p className="text-sm text-destructive">Could not load season data.</p>}

        {season && (
          <>
            <motion.div variants={item}>
              <GlassContainer className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-primary font-bold">Season {season.number}</p>
                    <h2 className="text-xl font-black">{season.name}</h2>
                    {season.description && <p className="text-sm text-muted-foreground mt-1">{season.description}</p>}
                  </div>
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase">
                    {season.status}
                  </span>
                </div>
                {season.endAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-accent-orange animate-pulse" />
                    Ends in <CountdownTimer endTime={season.endAt} />
                  </div>
                )}
              </GlassContainer>
            </motion.div>

            {progress && (
              <motion.div variants={item}>
                <GlassContainer className="p-5 space-y-4">
                  <h3 className="font-bold uppercase text-sm tracking-wide">Your Progress</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Stat label="Season XP" value={progress.seasonXp} />
                    <Stat label="Tier" value={progress.tierLevel} />
                    <Stat label="Rank" value={progress.seasonRank ?? "—"} />
                    <Stat label="Matches" value={progress.matchesPlayed ?? 0} />
                  </div>
                  {season.tiers && season.tiers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Next tier</p>
                      {(() => {
                        const next = season.tiers!.find((t) => t.tierLevel > progress.tierLevel);
                        if (!next) return <p className="text-sm font-semibold text-primary">Max tier reached</p>;
                        const pct = Math.min(100, Math.round((progress.seasonXp / next.xpRequired) * 100));
                        return (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{next.name}</span>
                              <span>{progress.seasonXp} / {next.xpRequired} XP</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary to-accent-purple" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </GlassContainer>
              </motion.div>
            )}

            {season.rewards && season.rewards.length > 0 && (
              <motion.div variants={item} className="space-y-3">
                <h3 className="font-bold uppercase text-sm tracking-wide">Season Rewards</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {season.rewards.map((reward) => (
                    <GlassContainer key={reward.id} className="p-4">
                      <p className="text-xs text-muted-foreground">Tier {reward.tierLevel}</p>
                      <p className="font-bold">{reward.name}</p>
                    </GlassContainer>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div variants={item}>
              <Link
                href="/arena"
                className="inline-flex px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent-purple text-white font-bold text-sm uppercase tracking-wide"
              >
                Play Arena for XP
              </Link>
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-3">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}
