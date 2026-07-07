"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";

export default function LeaderboardPage() {
  return (
    <AppShell activeNav="leaderboard">
      <FeaturePlaceholder
        title="Daily Leaderboard"
        description="XP and points rankings — Prompt 2."
        accent="purple"
      />
    </AppShell>
  );
}
