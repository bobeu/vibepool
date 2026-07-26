"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SpinHuntHub } from "@/features/spin";

export default function SpinPage() {
  return (
    <AppShell activeNav="spin">
      <SpinHuntHub />
    </AppShell>
  );
}
