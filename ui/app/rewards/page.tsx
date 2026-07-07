"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";

export default function RewardsPage() {
  return (
    <AppShell activeNav="rewards">
      <FeaturePlaceholder
        title="Reward Treasury"
        description="Points redemption and treasury overview — Prompt 2."
        accent="orange"
      />
    </AppShell>
  );
}
