"use client";

import { AppShell } from "@/components/layout/AppShell";
import { HomeHub } from "@/features/home/components/HomeHub";

export default function HomePage() {
  return (
    <AppShell activeNav="home">
      <HomeHub />
    </AppShell>
  );
}
