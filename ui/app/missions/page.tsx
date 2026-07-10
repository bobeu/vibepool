"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { MissionCard } from "@/components/ui/MissionCard";

export default function MissionsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const res = await fetch("/api/missions");
      if (!res.ok) throw new Error("Failed to fetch missions");
      return res.json();
    },
    staleTime: 15_000,
  });

  const claimMutation = useMutation({
    mutationFn: async (missionId: string) => {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      if (!res.ok) throw new Error("Failed to claim mission");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
  });

  if (isLoading) {
    return (
      <AppShell activeNav="home">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell activeNav="home">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive text-sm font-medium">Failed to load missions</p>
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
    <AppShell activeNav="home">
      <div className="space-y-4">
        <h1 className="text-xl font-black uppercase tracking-tight">Daily Missions</h1>
        {data?.missions?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No missions available right now.</p>
        )}
        <div className="space-y-3">
          {data?.missions?.map((mission: any) => (
            <MissionCard
              key={mission.id}
              title={mission.mission?.title ?? "Mission"}
              description={mission.mission?.description ?? ""}
              progress={mission.currentValue ?? 0}
              target={mission.targetValue ?? 1}
              reward={`${mission.mission?.xpReward ?? 0} XP`}
              accent="purple"
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
