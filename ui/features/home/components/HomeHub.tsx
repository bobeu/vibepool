"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { LevelProgress } from "@/components/ui/LevelProgress";
import { useAuth } from "@/lib/auth/middleware";

const SECTIONS = [
  { key: "tournament", label: "Daily Tournament", href: "/tournament" },
  { key: "missions", label: "Today's Missions", href: "/missions" },
  { key: "spin", label: "Available Spins", href: "/spin" },
  { key: "leaderboard", label: "Leaderboard Preview", href: "/leaderboard" },
  { key: "rewards", label: "Reward Center", href: "/rewards" },
] as const;

export function HomeHub() {
  const { data: tournaments } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const res = await fetch("/api/tournaments");
      if (!res.ok) throw new Error("Failed to fetch tournaments");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    staleTime: 15_000,
  });

  const { data: missions } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const res = await fetch("/api/missions");
      if (!res.ok) throw new Error("Failed to fetch missions");
      return res.json();
    },
    staleTime: 15_000,
  });

  const { data: spins } = useQuery({
    queryKey: ["spins"],
    queryFn: async () => {
      const res = await fetch("/api/spins");
      if (!res.ok) throw new Error("Failed to fetch spins");
      return res.json();
    },
    staleTime: 15_000,
  });

  const current = tournaments?.tournaments?.find((t: any) => t.status === "OPEN");

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 p-5"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent-orange)/0.15),transparent_40%),radial-gradient(circle_at_80%_80%,hsl(var(--accent-purple)/0.15),transparent_40%)]" />
        <div className="relative space-y-3">
          <h1 className="text-2xl font-black">
            Welcome to <span className="text-primary">NEXORA</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            The home of Web3 competitive games. Compete, earn, and climb the ranks.
          </p>
          {profile && (
            <div className="pt-2">
              <LevelProgress xp={profile.xp} level={profile.level} />
            </div>
          )}
        </div>
      </motion.section>

      {current && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-tight">Live Tournament</h2>
            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold animate-pulse">
              LIVE
            </span>
          </div>
          <TournamentCard tournament={current} priority />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Closes in <CountdownTimer endTime={current.endTime} />
          </div>
        </motion.section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/missions" className="glass-card flex items-center gap-4 p-4 block hover:bg-card/90 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-purple/10 text-accent-purple">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold">Missions</h3>
              <p className="text-xs text-muted-foreground">{missions?.missions?.length ?? 0} active today</p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link href="/spin" className="glass-card flex items-center gap-4 p-4 block hover:bg-card/90 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold">Spins</h3>
              <p className="text-xs text-muted-foreground">{spins?.available ?? 0} available</p>
            </div>
          </Link>
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-bold uppercase tracking-tight">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.filter(s => !["tournament", "missions", "spin"].includes(s.key)).map((section, i) => (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
            >
              <Link href={section.href} className="glass-card flex items-center gap-4 p-4 block hover:bg-card/90 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm">{section.label}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
