"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useVibepool } from "@/lib/context/VibepoolContext";

const SECTIONS = [
  { key: "tournament", label: "Daily Tournament", href: "/prediction", image: "/vibepool-predict.png" },
  { key: "missions", label: "Today's Missions", href: "/rewards", image: null },
  { key: "spin", label: "Available Spins", href: "/spin", image: null },
  { key: "leaderboard", label: "Leaderboard Preview", href: "/leaderboard", image: "/vibepool-coins-upward.png" },
  { key: "world", label: "Community", href: "/profile", image: "/vibepool-world.png" },
] as const;

export function HomeHub() {
  const { chainData, isConnected } = useVibepool();
  const prediction = chainData?.prediction;

  return (
    <div className="space-y-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 neon-border-orange overflow-hidden relative"
      >
        <h1 className="text-2xl font-black">
          Welcome to <span className="text-primary">Vibepool</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Skill-based competitive gaming on Celo — built for daily play.
        </p>
        {!isConnected && (
          <p className="text-xs text-accent-purple mt-2">
            Connect wallet to compete — or browse live tournament data below.
          </p>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-4 neon-border-purple"
      >
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
          Current Prize Pool
        </h2>
        <p className="text-lg font-bold mt-1">
          Higher: {prediction?.higherPool?.toString() ?? "—"} · Lower:{" "}
          {prediction?.lowerPool?.toString() ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Round {prediction?.roundId?.toString() ?? "—"} ·{" "}
          {prediction?.isRoundActive ? "Active" : "Closed"}
        </p>
      </motion.section>

      <div className="grid gap-3">
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
          >
            <Link href={section.href} className="glass-card flex items-center gap-4 p-4 block hover:bg-card/90 transition-colors">
              {section.image && (
                <img src={section.image} alt="" className="w-14 h-14 object-contain shrink-0" />
              )}
              <div>
                <h3 className="font-bold">{section.label}</h3>
                <p className="text-xs text-muted-foreground">Tap to explore</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
