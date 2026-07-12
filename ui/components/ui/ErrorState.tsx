"use client";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  actionLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  actionLabel = "Try again",
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
      <p className="text-sm font-bold uppercase tracking-wide text-destructive">{title}</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="neobrutal-card" onClick={onRetry}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
