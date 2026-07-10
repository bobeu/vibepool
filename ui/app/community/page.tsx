"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { SectionDivider } from "@/components/hero/SectionDivider";
import { container, item } from "@/lib/motion/variants";

const POST_STYLES: Record<string, string> = {
  ANNOUNCEMENT: "border-primary/30 text-primary",
  FEATURED: "border-accent-cyan/30 text-accent-cyan",
  HIGHLIGHT: "border-accent-orange/30 text-accent-orange",
  CHAMPION: "border-yellow-400/30 text-yellow-400",
  SEASONAL: "border-accent-purple/30 text-accent-purple",
};

export default function CommunityPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["community"],
    queryFn: async () => {
      const res = await fetch("/api/community");
      if (!res.ok) throw new Error("Failed to load community");
      return res.json();
    },
    staleTime: 15_000,
  });

  const posts: any[] = data?.posts ?? [];

  return (
    <AppShell activeNav="community">
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        <motion.section variants={item}>
          <h1 className="text-xl font-black uppercase tracking-tight">Community</h1>
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <SectionDivider label="Community Spotlight" />
          <GlassContainer className="p-5 text-center space-y-2">
            <p className="text-lg font-black uppercase tracking-tight text-gradient bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">
              NEXORA Champions
            </p>
            <p className="text-xs text-muted-foreground">
              The arena never sleeps. Climb the ranks, unlock legendary badges, and become a community legend.
            </p>
          </GlassContainer>
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <SectionDivider label="Announcements" />
          {isLoading && (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          )}
          {error && (
            <GlassContainer><p className="text-sm text-destructive text-center py-6">Failed to load community.</p></GlassContainer>
          )}
          {!isLoading && !error && posts.length === 0 && (
            <GlassContainer><p className="text-sm text-muted-foreground text-center py-6">No announcements yet.</p></GlassContainer>
          )}
          {!isLoading && !error && posts.map((post) => (
            <GlassContainer key={post.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">{post.title}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${POST_STYLES[post.type] ?? POST_STYLES.ANNOUNCEMENT}`}>
                  {post.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{post.body}</p>
              <p className="text-[10px] text-muted-foreground/70">
                {post.author} · {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </GlassContainer>
          ))}
        </motion.section>
      </motion.div>
    </AppShell>
  );
}
