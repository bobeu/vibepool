"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";

export default function LeaderboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <AppShell activeNav="leaderboard">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell activeNav="leaderboard">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive text-sm font-medium">Failed to load leaderboard</p>
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
    <AppShell activeNav="leaderboard">
      <div className="space-y-4">
        <h1 className="text-xl font-black uppercase tracking-tight">Leaderboard</h1>
        <div className="space-y-2">
          {data?.leaderboard?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No rankings yet.</p>
          )}
          {data?.leaderboard?.map((entry: any, index: number) => (
            <div
              key={entry.userId ?? index}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 p-3"
            >
              <span className={`w-6 text-center text-sm font-black ${index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : index === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                #{index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{entry.user?.username ?? "Player"}</p>
                <p className="text-xs text-muted-foreground">{entry.xp?.toLocaleString()} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
