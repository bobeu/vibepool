"use client";

import { cn } from "@/utils/format";
import type { HTMLAttributes } from "react";

interface BrutalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "yellow" | "cyan";
}

export function BrutalCard({ variant = "default", className, children, ...props }: BrutalCardProps) {
  const variants = {
    default: "brutal-card",
    yellow: "brutal-card-yellow",
    cyan: "brutal-card-cyan",
  };

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
