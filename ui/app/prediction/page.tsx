"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";

export default function PredictionPage() {
  return (
    <AppShell activeNav="prediction">
      <FeaturePlaceholder
        title="Daily Prediction Tournament"
        description="Phase 1 module — prediction UI and game logic will be implemented in Prompt 2."
        accent="orange"
      />
    </AppShell>
  );
}
