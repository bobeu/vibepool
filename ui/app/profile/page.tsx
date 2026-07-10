"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { LevelProgress } from "@/components/ui/LevelProgress";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { SectionDivider } from "@/components/hero/SectionDivider";
import { useAuth } from "@/lib/auth/useAuth";
import { container, item } from "@/lib/motion/variants";

const url = (path: string) => {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    staleTime: 15_000,
    enabled: !!session,
  });

  const { data: identity, isLoading: identityLoading } = useQuery({
    queryKey: ["profile", "identity"],
    queryFn: async () => {
      const res = await fetch("/api/profile/identity");
      if (!res.ok) throw new Error("Failed to fetch identity");
      return res.json();
    },
    staleTime: 15_000,
    enabled: !!session,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
    staleTime: 15_000,
    enabled: !!session,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["profile", "timeline"],
    queryFn: async () => {
      const res = await fetch("/api/profile/timeline");
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    staleTime: 15_000,
    enabled: !!session,
  });

  const { data: titles } = useQuery({
    queryKey: ["profile", "titles"],
    queryFn: async () => {
      const res = await fetch("/api/profile/title");
      if (!res.ok) throw new Error("Failed to fetch titles");
      return res.json();
    },
    staleTime: 15_000,
    enabled: !!session,
  });

  const { data: badges } = useQuery({
    queryKey: ["profile", "badges"],
    queryFn: async () => {
      const res = await fetch("/api/profile/badge");
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
    staleTime: 15_000,
    enabled: !!session,
  });

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/achievements", { method: "POST" });
      if (!res.ok) throw new Error("Failed to evaluate achievements");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });

  if (!session) {
    return (
      <AppShell activeNav="profile">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-sm">Connect your wallet to view your profile.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="profile">
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        <motion.section variants={item}>
          <GlassContainer className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-purple text-xl font-black text-white">
                {profile?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold">{identity?.displayName ?? profile?.username ?? "Player"}</h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {session?.wallet?.slice(0, 6)}...{session?.wallet?.slice(-4)}
                </p>
                {identity?.selectedTitle && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {identity.selectedTitle}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <LevelProgress xp={profile?.xp ?? 0} level={profile?.level ?? 0} />
            </div>
          </GlassContainer>
        </motion.section>

        <motion.section variants={item} className="grid grid-cols-2 gap-3">
          <StatCard label="Total XP" value={profile?.xp?.toLocaleString() ?? "0"} />
          <StatCard label="Points" value={profile?.points?.toLocaleString() ?? "0"} />
          <StatCard label="Spins" value={profile?.spins?.toString() ?? "0"} />
          <StatCard label="Rank" value={`#${profile?.currentRank ?? "—"}`} />
          <StatCard label="Current Streak" value={`${profile?.currentStreak ?? 0} days`} />
          <StatCard label="Best Streak" value={`${profile?.longestStreak ?? 0} days`} />
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-tight">Identity</h2>
          </div>
          <GlassContainer className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {titles?.titles?.map((t: any) => (
                <span
                  key={t.slug}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    t.equipped
                      ? "bg-primary/10 border-primary text-primary"
                      : t.unlocked
                        ? "bg-muted/50 border-border text-foreground"
                        : "bg-muted/30 border-border/50 text-muted-foreground"
                  }`}
                >
                  {t.name}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {badges?.badges?.map((b: any) => (
                <span
                  key={b.slug}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    b.equipped
                      ? "bg-accent-purple/10 border-accent-purple text-accent-purple"
                      : "bg-muted/50 border-border text-foreground"
                  }`}
                >
                  {b.name}
                </span>
              ))}
            </div>
          </GlassContainer>
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-tight">Achievements</h2>
            <button
              type="button"
              onClick={() => evaluateMutation.mutate()}
              disabled={evaluateMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide transition-all hover:bg-primary/20 disabled:opacity-50"
            >
              {evaluateMutation.isPending ? "Evaluating..." : "Evaluate"}
            </button>
          </div>
          <GlassContainer className="p-4">
            {achievementsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {achievements?.achievements?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No achievements yet.</p>
                )}
                {achievements?.achievements?.map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-3"
                  >
                    <div>
                      <p className="font-bold text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        a.unlocked ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {a.unlocked ? "Unlocked" : `${a.progress}/${a.target}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassContainer>
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <h2 className="text-lg font-bold uppercase tracking-tight">Progress Timeline</h2>
          <GlassContainer className="p-4">
            {timelineLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {timeline?.timeline?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No snapshots yet.</p>
                )}
                {timeline?.timeline?.map((snapshot: any) => (
                  <div key={snapshot.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-3">
                    <div>
                      <p className="font-bold text-sm">{snapshot.snapshotType}</p>
                      <p className="text-xs text-muted-foreground">
                        Level {snapshot.level} · {snapshot.xp?.toLocaleString()} XP
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(snapshot.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassContainer>
        </motion.section>
      </motion.div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
