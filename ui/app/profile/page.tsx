"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";

export default function ProfilePage() {
  return (
    <AppShell activeNav="profile">
      <FeaturePlaceholder
        title="User Profile"
        description="Wallet identity, XP, level, stats, and achievements — Prompt 2."
        accent="orange"
      />
    </AppShell>
  );
}
