"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  RotateCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Zap,
  CheckCircle,
} from "lucide-react";
import { authFetch, startFreePlaySession } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useEnsureSession } from "@/hooks/useEnsureSession";
import { cn } from "@/utils/format";

export function PredictHub() {
  const { session, isLoading: authLoading, isFreePlay, refreshSession } = useAuth();
  const { isConnected } = useEnsureSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => {
      const res = await authFetch("/api/predictions");
      if (!res.ok) throw new Error("Failed to load prediction round");
      return res.json();
    },
    enabled: Boolean(session),
  });

  const tournament = data?.tournament;

  const submitMutation = useMutation({
    mutationFn: async (payload: { predictionValue?: number; higher?: boolean }) => {
      const res = await authFetch("/api/predictions", {
        method: "POST",
        body: JSON.stringify({
          tournamentId: tournament?.id,
          ...payload,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to submit prediction");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["predictions"] }),
  });
  const submitted = Boolean(data?.userPrediction);
  const higherPool = Number(tournament?.higherPool ?? 0.34);
  const lowerPool  = Number(tournament?.lowerPool  ?? 0.32);
  const totalPool  = higherPool + lowerPool || 0.66;
  const startPrice = tournament?.startPrice ?? 0.071;
  const roundId    = tournament?.id ?? 35;
  const playerCount = tournament?.participantCount ?? 21;

  const handleStartFreePlay = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const ok = await startFreePlaySession();
      if (!ok) {
        setStartError("Could not start free play — try again");
        return;
      }
      await refreshSession();
      await queryClient.invalidateQueries({ queryKey: ["predictions"] });
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "Free play failed");
    } finally {
      setStarting(false);
    }
  };

  if (authLoading || (session && isLoading)) {
    return (
      <div className="space-y-4">
        <div className="h-44 rounded-2xl border-2 border-white/10 bg-zinc-900/80 animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-zinc-900/80 animate-pulse border-2 border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4 text-center py-12 px-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border-4 border-primary mx-auto flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,0.6)]">
          <Sparkles className="w-8 h-8 text-primary" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-black uppercase italic text-xl text-white">Volatility Predict</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try a free practice round first — no funds required.
          </p>
        </div>
        <button
          type="button"
          disabled={starting}
          onClick={() => void handleStartFreePlay()}
          className="w-full max-w-xs mx-auto py-3.5 rounded-2xl bg-[#FBBF24] text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] disabled:opacity-60"
        >
          {starting ? "Starting…" : "Start Free Play"}
        </button>
        {startError && <p className="text-sm font-bold text-red-400">{startError}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Activity className="w-8 h-8 text-destructive mx-auto mb-3" strokeWidth={2.5} />
        <p className="text-sm text-destructive font-bold">Failed to load prediction data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isFreePlay && !isConnected && (
        <div className="rounded-xl border-2 border-[#FBBF24]/50 bg-[#FBBF24]/10 px-3 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FBBF24]">
            Free Play · Practice round · No funds at risk
          </p>
        </div>
      )}

      {/* ── Hero Image Banner ── */}
      <div className="relative rounded-2xl overflow-hidden border-4 border-black h-44 shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <Image
          src="/prediction.png"
          alt="Volatility Predict"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 bg-[#FBBF24] text-black font-black text-[9px] uppercase px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
            <Users className="w-3 h-3" strokeWidth={2.5} />
            {playerCount} Players
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-3 left-4 right-4">
          <p className="font-black uppercase italic text-white text-xl leading-tight drop-shadow-[2px_2px_0_#000]">
            CELO Volatility<br />Predict
          </p>
          <p className="text-[10px] text-white/80 font-bold mt-0.5">
            Round #{roundId} · Start ${Number(startPrice).toFixed(3)}
          </p>
        </div>

        {/* Round badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/70 text-primary font-black text-[9px] uppercase px-2.5 py-1 rounded-lg border border-primary/30 backdrop-blur-sm">
            Live
          </span>
        </div>
      </div>

      {/* ── Pool Stats ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Pool", value: totalPool.toFixed(2), icon: DollarSign, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
          { label: "Higher ↑",   value: higherPool.toFixed(2), icon: TrendingUp,   color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
          { label: "Lower ↓",    value: lowerPool.toFixed(2),  icon: TrendingDown, color: "text-red-400",   bg: "bg-red-500/10 border-red-500/30" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className={cn("rounded-2xl border-2 p-3 text-center", bg)}
          >
            <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} strokeWidth={2.5} />
            <p className={cn("text-sm font-black tabular-nums", color)}>{value}</p>
            <p className="text-[8px] font-black uppercase text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Mode Toggle ── */}
      <div className="flex rounded-2xl overflow-hidden border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={cn(
            "flex-1 py-3 text-xs font-black uppercase transition-all border-r-4 border-black",
            mode === "manual" ? "bg-black text-primary" : "bg-white text-black"
          )}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={cn(
            "flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all",
            mode === "ai" ? "bg-black text-[#62E2F8]" : "bg-white text-black"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
          AI Forecast
        </button>
      </div>

      {/* ── AI Analyst Card ── */}
      <div className="rounded-2xl border-4 border-black bg-[#62E2F8] text-black shadow-[4px_4px_0_rgba(0,0,0,1)] p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" strokeWidth={2.5} />
            <p className="text-xs font-black uppercase">AI Analyst</p>
          </div>
          <button type="button">
            <RotateCw className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <div>
            <span className="text-black/60 text-[9px] uppercase font-black tracking-wide">Threshold</span>
            <p className="font-black">1.1%</p>
          </div>
          <div>
            <span className="text-black/60 text-[9px] uppercase font-black tracking-wide">Mode</span>
            <p className="font-black uppercase">{mode}</p>
          </div>
        </div>
        <p className="text-[11px] font-semibold leading-relaxed">
          {mode === "manual"
            ? "Manual analysis mode. Switch to AI Mode for real-time market signal predictions."
            : "AI forecast active — predictions weighted by live Celo market signals."}
        </p>
      </div>

      {/* ── Prediction Form / Status ── */}
      {!tournament ? (
        <div className="rounded-2xl border-2 border-white/10 bg-zinc-900/80 p-6 text-center">
          <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" strokeWidth={2.5} />
          <p className="text-sm font-bold text-muted-foreground">No open round right now.</p>
          <p className="text-[10px] text-muted-foreground mt-1">Check back soon for the next prediction round.</p>
        </div>
      ) : submitted ? (
        <div className="rounded-2xl border-4 border-green-500 bg-green-500/10 p-5 text-center shadow-[4px_4px_0_rgba(0,0,0,0.4)]">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" strokeWidth={2.5} />
          <p className="font-black uppercase text-green-400 text-sm">Prediction Submitted!</p>
          <p className="text-[10px] text-muted-foreground mt-1">Good luck — results come after round closes.</p>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const value = Number((form.elements.namedItem("value") as HTMLInputElement).value);
            if (!Number.isNaN(value) && value > 0) {
              submitMutation.mutate({ predictionValue: value });
            }
          }}
        >
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Your Price Prediction (CELO)
            </label>
            <input
              name="value"
              type="number"
              step="any"
              min="0"
              required
              placeholder="e.g. 0.075"
              className="w-full rounded-2xl bg-zinc-900 border-4 border-black px-4 py-3 text-sm font-black text-white placeholder:text-white/30 shadow-[3px_3px_0_rgba(0,0,0,0.6)] focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Higher / Lower buttons — skill direction vs round start */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => submitMutation.mutate({ higher: true })}
              disabled={submitMutation.isPending}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#FBBF24] text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all hover:bg-yellow-300 disabled:opacity-40"
            >
              <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
              Higher ↑
            </button>
            <button
              type="button"
              onClick={() => submitMutation.mutate({ higher: false })}
              disabled={submitMutation.isPending}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all hover:bg-zinc-100 disabled:opacity-40"
            >
              <TrendingDown className="w-4 h-4" strokeWidth={2.5} />
              Lower ↓
            </button>
          </div>

          {/* Submit prediction button */}
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full py-3.5 rounded-2xl bg-[#62E2F8] text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all hover:bg-[#48d0e7] disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4" strokeWidth={2.5} />
            {submitMutation.isPending ? "Submitting…" : "Submit Prediction"}
          </button>

          {submitMutation.isError && (
            <p className="text-xs text-destructive font-bold text-center">
              Could not submit. You may have already predicted this round.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
