"use client";

import { AppShell } from "@/components/layout/AppShell";
import { HomeHub } from "@/features/home/components/HomeHub";
import { PredictHub } from "@/features/prediction/components/PredictHub";

export default function HomePage() {
  return (
    <>
      <AppShell activeNav="home" variant="mobile">
        <HomeHub />
      </AppShell>
      <AppShell activeNav="home" variant="tablet">
        <PredictHub />
      </AppShell>
    </>
  );
}
