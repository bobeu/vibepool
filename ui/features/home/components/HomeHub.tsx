"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { LevelProgress } from "@/components/ui/LevelProgress";
import { HeroBanner } from "@/components/hero/HeroBanner";
import { useAuth } from "@/lib/auth/useAuth";

const SECTIONS = [
  { key: "tournament", label: "Daily Tournament", href: "/tournament" },
  { key: "missions", label: "Today's Missions", href: "/missions" },
  { key: "achievements", label: "Achievements", href: "/achievements" },
  { key: "spin", label: "Available Spins", href: "/spin" },
  { key: "leaderboard", label: "Leaderboard Preview", href: "/leaderboard" },
  { key: "rewards", label: "Reward Center", href: "/rewards" },
  { key: "referrals", label: "Invite Friends", href: "/referrals" },
] as const;

export function HomeHub() {
  const router = useRouter();

  const { data: heroData } = useQuery({
    queryKey: ["hero-banner"],
    queryFn: async () => {
      const res = await fetch("/api/content?hero=1");
      if (!res.ok) throw new Error("Failed to load hero");
      return res.json() as Promise<{ hero: { title?: string; subtitle?: string; body?: string; ctaLabel?: string; ctaUrl?: string } }>;
    },
    staleTime: 30_000,
  });

  const { data: seasonData } = useQuery({
    queryKey: ["season-end"],
    queryFn: async () => {
      const res = await fetch("/api/seasons");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  const hero = heroData?.hero;

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

  const { data: community } = useQuery({
    queryKey: ["community-spotlight"],
    queryFn: async () => {
      const res = await fetch("/api/community");
      if (!res.ok) throw new Error("Failed to load community");
      return res.json();
    },
    staleTime: 15_000,
  });

  const current = tournaments?.tournaments?.find((t: any) => t.status === "OPEN");

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <HeroBanner
          title={hero?.title ?? "Welcome to NEXORA"}
          subtitle={hero?.subtitle ?? hero?.body ?? "The home of Web3 competitive games. Compete, earn, and climb the ranks."}
          cta={hero?.ctaLabel ?? "Play Arena"}
          onCta={() => router.push(hero?.ctaUrl ?? "/arena")}
        />
        {profile && (
          <div className="pt-3">
            <LevelProgress xp={profile.xp} level={profile.level} />
          </div>
        )}
        {seasonData?.active?.endAt && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-accent-purple animate-pulse" />
            Season {seasonData.active.number} ends in <CountdownTimer endTime={seasonData.active.endAt} />
          </p>
        )}
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-tight">Community Spotlight</h2>
          <Link href="/community" className="text-xs font-semibold text-primary">View all</Link>
        </div>
        <Link href="/community" className="glass-card block p-4 hover:bg-card/90 transition-colors">
          <p className="text-sm font-black uppercase tracking-tight text-transparent bg-gradient-to-r from-primary to-accent-purple bg-clip-text">
            Today's Champions
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(community?.posts ?? []).slice(0, 1).map((p: any) => p.title).join("") || "Climb the ranks and earn your place among the legends."}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-accent-cyan/10 text-accent-cyan capitalize">Trending Players</span>
            <span className="px-2 py-1 rounded-full bg-accent-purple/10 text-accent-purple capitalize">Season Countdown</span>
          </div>
        </Link>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-bold uppercase tracking-tight">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.filter((s) => !["tournament", "missions", "spin"].includes(s.key)).map((section, i) => (
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
