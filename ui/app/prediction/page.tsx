"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PredictHub } from "@/features/prediction/components/PredictHub";

export default function PredictionPage() {
  return (
    <AppShell activeNav="prediction" variant="auto">
      <PredictHub />
    </AppShell>
  );
}
