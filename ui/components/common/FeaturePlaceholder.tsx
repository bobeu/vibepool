"use client";

import { cn } from "@/utils/format";
import type { NavKey } from "@/types";

interface FeaturePlaceholderProps {
  title: string;
  description: string;
  accent?: "orange" | "purple";
}

export function FeaturePlaceholder({
  title,
  description,
  accent = "orange",
}: FeaturePlaceholderProps) {
  return (
    <section
      className={cn(
        "glass-card p-6 animate-fade-in",
        accent === "orange" ? "neon-border-orange" : "neon-border-purple"
      )}
    >
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <p className="mt-4 text-xs text-muted-foreground/80">
        Architecture scaffold only — no business logic in Phase 1 Prompt 1.
      </p>
    </section>
  );
}
