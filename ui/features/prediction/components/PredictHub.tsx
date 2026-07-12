"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw } from "lucide-react";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";

export function PredictHub() {
  const { session, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"manual" | "ai">("manual");

  const { data, isLoading, error } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => {
      const res = await authFetch("/api/predictions");
      if (!res.ok) throw new Error("Failed to load prediction round");
      return res.json();
    },
    enabled: Boolean(session),
  });

  const submitMutation = useMutation({
    mutationFn: async (predictionValue: number) => {
      const res = await authFetch("/api/predictions", {
        method: "POST",
        body: JSON.stringify({ predictionValue }),
      });
      if (!res.ok) throw new Error("Failed to submit prediction");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["predictions"] }),
  });

  const tournament = data?.tournament;
  const submitted = Boolean(data?.userPrediction);
  const higherPool = Number(tournament?.higherPool ?? 0.34);
  const lowerPool = Number(tournament?.lowerPool ?? 0.32);
  const totalPool = higherPool + lowerPool || 0.66;
  const startPrice = tournament?.startPrice ?? 0.071;
  const roundId = tournament?.id ?? 35;
  const playerCount = tournament?.participantCount ?? 21;

  if (authLoading || isLoading) {
    return <div className="h-64 brutal-card animate-pulse bg-muted" />;
  }

  if (!session) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="brutal-heading text-xl">Volatility Predict</p>
        <p className="text-sm text-muted-foreground">Connect your wallet to join the CELO arena.</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-sm text-center py-12">Failed to load prediction data.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Arena badge + round info — vibecheck layout */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 border-[3px] border-black bg-secondary px-3 py-1 text-xs font-black uppercase shadow-[3px_3px_0_#000]">
          Celo Arena ({playerCount} players)
        </span>
        <div className="flex gap-3 text-xs font-black uppercase">
          <span>Round #{roundId}</span>
          <span>Start ${Number(startPrice).toFixed(3)}</span>
        </div>
      </div>

      {/* Gauge hero */}
      <BrutalCard className="relative overflow-hidden p-0">
        <div className="relative h-48 w-full border-b-[3px] border-black bg-black">
          <Image
            src="/spin.png"
            alt="Volatility Predict"
            fill
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <p className="brutal-heading text-white text-xl drop-shadow-[2px_2px_0_#000]">
              Volatility Predict
            </p>
            <p className="text-[10px] font-bold text-white/90 mt-1 max-w-xs">
              Predict CELO price — win a share of the losing pool | Multiplayer staking
            </p>
          </div>
        </div>
      </BrutalCard>

      {/* Pool stats */}
      <div className="grid grid-cols-3 gap-2">
        <BrutalCard className="p-3 text-center">
          <p className="text-[10px] font-black uppercase text-muted-foreground">Total Pool</p>
          <p className="text-lg font-black text-primary">{totalPool.toFixed(2)}</p>
        </BrutalCard>
        <BrutalCard className="p-3 text-center">
          <p className="text-[10px] font-black uppercase text-muted-foreground">Higher</p>
          <p className="text-lg font-black text-accent-green">{higherPool.toFixed(2)}</p>
        </BrutalCard>
        <BrutalCard className="p-3 text-center">
          <p className="text-[10px] font-black uppercase text-muted-foreground">Lower</p>
          <p className="text-lg font-black text-accent-red">{lowerPool.toFixed(2)}</p>
        </BrutalCard>
      </div>

      {/* Title + mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="brutal-heading text-lg">Predict Volatility</h1>
        <span className="text-[10px] font-black uppercase border-[2px] border-black px-2 py-1 bg-white shadow-[2px_2px_0_#000]">
          Staked with CELO
        </span>
      </div>

      <div className="flex border-[3px] border-black shadow-[4px_4px_0_#000]">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 py-2.5 text-xs font-black uppercase border-r-[3px] border-black ${
            mode === "manual" ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={`flex-1 py-2.5 text-xs font-black uppercase flex items-center justify-center gap-1 ${
            mode === "ai" ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Forecast
        </button>
      </div>

      {/* AI Analyst panel */}
      <BrutalCard variant="cyan" className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase">AI Analyst</p>
          <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <div>
            <span className="text-black/60">Threshold</span>
            <p>1.1%</p>
          </div>
          <div>
            <span className="text-black/60">Forecast</span>
            <p className="uppercase">{mode}</p>
          </div>
        </div>
        <p className="text-[11px] font-medium">
          {mode === "manual"
            ? "Using manual analysis. Unlock real-time predictions via AI Mode."
            : "AI forecast active — predictions weighted by market signals."}
        </p>
      </BrutalCard>

      {/* Prediction form */}
      {!tournament ? (
        <p className="text-sm text-muted-foreground text-center py-6">No open round right now.</p>
      ) : submitted ? (
        <BrutalCard className="p-4 text-center">
          <p className="font-black uppercase text-accent-green">Prediction submitted — good luck!</p>
        </BrutalCard>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const value = Number((form.elements.namedItem("value") as HTMLInputElement).value);
            if (!Number.isNaN(value)) submitMutation.mutate(value);
          }}
        >
          <input
            name="value"
            type="number"
            step="any"
            required
            placeholder="Your price prediction"
            className="brutal-input"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => submitMutation.mutate(1)}>
              Higher ↑
            </Button>
            <Button type="button" variant="white" size="lg" className="w-full" onClick={() => submitMutation.mutate(0)}>
              Lower ↓
            </Button>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Submitting…" : "Submit Prediction"}
          </Button>
          {submitMutation.isError && (
            <p className="text-xs text-destructive font-bold">Could not submit. You may have already predicted.</p>
          )}
        </form>
      )}
    </div>
  );
}
