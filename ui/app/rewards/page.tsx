"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { authFetch } from "@/lib/auth/client";
import { useEnsureSession } from "@/hooks/useEnsureSession";
import { BrutalCard } from "@/components/ui/BrutalCard";

export default function RewardsPage() {
  const queryClient = useQueryClient();
  const { ready } = useEnsureSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ["rewards"],
    enabled: ready,
    queryFn: async () => {
      const res = await authFetch("/api/rewards");
      if (!res.ok) throw new Error("Failed to fetch rewards");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/rewards", {
        method: "POST",
        body: JSON.stringify({ type: "points" }),
      });
      if (!res.ok) throw new Error("Failed to claim reward");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rewards"] }),
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
        
        {/* Rewards Hero Cover Asset */}
        <BrutalCard className="relative overflow-hidden p-0">
          <div className="relative h-48 w-full border-b-[3px] border-black bg-black">
            <Image
              src="/reward.png"
              alt="Rewards"
              fill
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <p className="brutal-heading text-white text-xl drop-shadow-[2px_2px_0_#000]">
                Claim Rewards
              </p>
              <p className="text-[10px] font-bold text-white/95 mt-1 max-w-xs drop-shadow-[1px_1px_0_#000]">
                Redeem your points and XP for real tokens and exclusive dynamic yield pools
              </p>
            </div>
          </div>
        </BrutalCard>
        {data?.rewards?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No claimable rewards right now.</p>
        )}
        <div className="space-y-3">
          {data?.rewards?.map((reward: any) => (
            <div
              key={reward.id}
              className="rounded-xl border border-border/50 bg-card/60 p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-sm">{reward.reward ?? reward.type ?? "Reward"}</p>
                <p className="text-xs text-muted-foreground">{reward.asset ?? "points"} · {reward.amount ?? reward.value}</p>
              </div>
              <button
                type="button"
                onClick={() => claimMutation.mutate()}
                disabled={claimMutation.isPending}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold"
              >
                Claim
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
