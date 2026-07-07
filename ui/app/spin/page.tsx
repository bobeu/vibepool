"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";

export default function SpinPage() {
  return (
    <AppShell activeNav="spin">
      <FeaturePlaceholder
        title="Spin Rewards"
        description="Daily spin wheel and reward claims — Prompt 2."
        accent="purple"
      />
    </AppShell>
  );
}
