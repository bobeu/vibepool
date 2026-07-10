"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";

export default function SpinPage() {
  const queryClient = useQueryClient();
  const [isSpinning, setIsSpinning] = useState(false);

  const { data: spins, isLoading } = useQuery({
    queryKey: ["spins"],
    queryFn: async () => {
      const res = await fetch("/api/spins");
      if (!res.ok) throw new Error("Failed to fetch spins");
      return res.json();
    },
    staleTime: 15_000,
  });

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/spins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) throw new Error("Failed to spin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spins"] });
      setIsSpinning(false);
    },
  });

  const handleSpin = () => {
    if (spins?.available > 0 && !isSpinning) {
      setIsSpinning(true);
      spinMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <AppShell activeNav="spin">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="spin">
      <div className="flex flex-col items-center justify-center py-10 space-y-6">
        <div className="relative">
          <div
            className={`
              flex h-48 w-48 items-center justify-center rounded-full border-4 border-primary/40 bg-gradient-to-br from-primary/10 to-accent-purple/10
              ${isSpinning ? "animate-spin" : ""}
              transition-transform duration-[3000ms] ease-out
            `}
          >
            <div className="text-center space-y-1">
              <p className="text-4xl font-black">{spins?.available ?? 0}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Spins</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSpin}
          disabled={spins?.available <= 0 || isSpinning || spinMutation.isPending}
          className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-primary to-accent-purple text-white font-bold uppercase tracking-wide transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSpinning || spinMutation.isPending ? "Spinning..." : spins?.available > 0 ? "Spin Now" : "No Spins Available"}
        </button>

        {spinMutation.isError && (
          <p className="text-xs text-destructive text-center">{(spinMutation.error as Error).message}</p>
        )}
      </div>
    </AppShell>
  );
}
