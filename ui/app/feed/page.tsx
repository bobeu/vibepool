"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { SectionDivider } from "@/components/hero/SectionDivider";
import { container, item } from "@/lib/motion/variants";

const FEED_STYLES: Record<string, string> = {
  ACHIEVEMENT: "border-yellow-400/30 text-yellow-400",
  REWARD: "border-green-400/30 text-green-400",
  TOURNAMENT: "border-accent-orange/30 text-accent-orange",
  BADGE: "border-accent-purple/30 text-accent-purple",
  MISSION: "border-blue-400/30 text-blue-400",
  REFERRAL: "border-accent-cyan/30 text-accent-cyan",
  FRIEND_REQUEST: "border-primary/30 text-primary",
  PRESENCE: "border-muted-foreground/30 text-muted-foreground",
  LEVEL_UP: "border-yellow-400/30 text-yellow-400",
  SPIN: "border-accent-cyan/30 text-accent-cyan",
  SYSTEM: "border-border text-muted-foreground",
};

export default function FeedPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const res = await fetch("/api/feed");
      if (!res.ok) throw new Error("Failed to load feed");
      return res.json();
    },
    staleTime: 15_000,
  });

  const items: any[] = data?.feed ?? [];

  return (
    <AppShell activeNav="friends">
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        <motion.section variants={item}>
          <h1 className="text-xl font-black uppercase tracking-tight">Activity Feed</h1>
        </motion.section>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <GlassContainer>
            <p className="text-sm text-destructive text-center py-6">Failed to load activity feed.</p>
          </GlassContainer>
        )}

        {!isLoading && !error && (
          <motion.section variants={item} className="space-y-3">
            <SectionDivider label="Recent Activity" />
            {items.length === 0 ? (
              <GlassContainer>
                <p className="text-sm text-muted-foreground text-center py-10">No activity yet. Connect with friends to see their progress!</p>
              </GlassContainer>
            ) : (
              items.map((item) => (
                <GlassContainer key={item.id} className="p-4 flex items-start gap-3">
                  <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${FEED_STYLES[item.type] ?? FEED_STYLES.SYSTEM}`}>
                    {item.type}
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm">{item.title}</p>
                    {item.body && <p className="text-xs text-muted-foreground">{item.body}</p>}
                    <p className="text-[10px] text-muted-foreground/70">
                      {item.actor ? `by ${item.actor} · ` : ""}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </GlassContainer>
              ))
            )}
          </motion.section>
        )}
      </motion.div>
    </AppShell>
  );
}
