"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { SectionDivider } from "@/components/hero/SectionDivider";
import { container, item } from "@/lib/motion/variants";

const RARITY_COLORS: Record<string, string> = {
  COMMON: "text-muted-foreground border-border",
  RARE: "text-blue-400 border-blue-400/30",
  EPIC: "text-purple-400 border-purple-400/30",
  LEGENDARY: "text-yellow-400 border-yellow-400/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  LIFETIME: "Lifetime",
  HIDDEN: "Hidden",
  LEGENDARY: "Legendary",
  SEASONAL: "Seasonal",
  COMMUNITY: "Community",
  REFERRAL: "Referral",
  TOURNAMENT: "Tournament",
  SKILL: "Skill",
};

export default function AchievementsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
    staleTime: 15_000,
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

  const grouped = (data?.achievements || []).reduce<Record<string, typeof data.achievements>>((acc, achievement: any) => {
    const category = achievement.category || "LIFETIME";
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <AppShell activeNav="home">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell activeNav="home">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive text-sm font-medium">Failed to load achievements</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="home">
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        <motion.section variants={item} className="flex items-center justify-between">
          <h1 className="text-xl font-black uppercase tracking-tight">Achievements</h1>
          <button
            type="button"
            onClick={() => evaluateMutation.mutate()}
            disabled={evaluateMutation.isPending}
            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide transition-all hover:bg-primary/20 disabled:opacity-50"
          >
            {evaluateMutation.isPending ? "Evaluating..." : "Evaluate"}
          </button>
        </motion.section>

        {Object.entries(grouped).length === 0 && (
          <GlassContainer>
            <p className="text-sm text-muted-foreground text-center py-10">No achievements available yet.</p>
          </GlassContainer>
        )}

        {Object.entries(grouped).map(([category, achievements]: [string, any[]]) => (
          <motion.section key={category} variants={item} className="space-y-3">
            <SectionDivider label={CATEGORY_LABELS[category] || category} />
            <div className="grid gap-3">
              {achievements.map((achievement: any) => (
                <GlassContainer key={achievement.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">{achievement.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            RARITY_COLORS[achievement.rarity] || RARITY_COLORS.COMMON
                          }`}
                        >
                          {achievement.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        achievement.unlocked ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {achievement.unlocked ? "Unlocked" : `${achievement.progress}/${achievement.target}`}
                    </span>
                  </div>
                  {!achievement.unlocked && (
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent-purple transition-all duration-500"
                        style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </GlassContainer>
              ))}
            </div>
          </motion.section>
        ))}
      </motion.div>
    </AppShell>
  );
}
