"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";

export default function RewardsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const res = await fetch("/api/rewards");
      if (!res.ok) throw new Error("Failed to fetch rewards");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <AppShell activeNav="rewards">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell activeNav="rewards">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive text-sm font-medium">Failed to load rewards</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="rewards">
      <div className="space-y-4">
        <h1 className="text-xl font-black uppercase tracking-tight">Rewards</h1>
        {data?.rewards?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No claimable rewards right now.</p>
        )}
        <div className="space-y-3">
          {data?.rewards?.map((reward: any) => (
            <div
              key={reward.id}
              className="rounded-xl border border-border/50 bg-card/60 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-sm">{reward.reward}</p>
                <p className="text-xs text-muted-foreground">{reward.asset} · {reward.amount}</p>
              </div>
              <span className="text-xs font-semibold text-green-400">Claimable</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
