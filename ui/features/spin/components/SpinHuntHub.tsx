"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, RotateCcw, Ticket, X, Zap } from "lucide-react";
import { formatUnits } from "viem";
import { authFetch } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useSpinEconomyPayment } from "@/hooks/useSpinEconomyPayment";
import { useUIStore } from "@/store/uiStore";
import { assetDecimals } from "@/lib/tokens/celoAssets";
import { isSpinPayAsset } from "@/lib/spin/economy";
import type { HuntSession, PublicBubble } from "@/features/spin/types";
import { BubbleArena } from "./BubbleArena";
import { SpinLoadoutPanel } from "./SpinLoadoutPanel";
import { SEGMENTS, SLICE_DEG, TOTAL, SpinWheelPanel } from "./SpinWheelPanel";

function formatCash(amountWei: string, asset: string) {
  try {
    if (!isSpinPayAsset(asset)) return `${amountWei} ${asset}`;
    const n = Number(formatUnits(BigInt(amountWei || "0"), assetDecimals(asset)));
    if (n === 0) return `0 ${asset}`;
    return `${n < 0.0001 ? n.toExponential(2) : n.toPrecision(4)} ${asset}`;
  } catch {
    return `${amountWei} ${asset}`;
  }
}

export function SpinHuntHub() {
  const queryClient = useQueryClient();
  const { isFreePlay } = useAuth();
  const showToast = useUIStore((s) => s.showToast);
  const { payEntry, busy: paying, preferredAsset, feeLabel, isConnected } =
    useSpinEconomyPayment();

  const [session, setSession] = useState<HuntSession | null>(null);
  const [hunting, setHunting] = useState(false);
  const [cashEarnedWei, setCashEarnedWei] = useState("0");
  const [cashAsset, setCashAsset] = useState("USDm");
  const [rotation, setRotation] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevRotation = useRef(0);
  const huntTimer = useRef<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["spin-hunt-config"],
    queryFn: async () => {
      const res = await authFetch("/api/spins/config");
      if (!res.ok) throw new Error("Failed to load Spin Hunt");
      return res.json();
    },
    staleTime: 15_000,
  });

  const { data: history } = useQuery({
    queryKey: ["spin-history"],
    queryFn: async () => {
      const res = await authFetch("/api/spin/history");
      if (!res.ok) return { history: [] };
      return res.json();
    },
    staleTime: 10_000,
  });

  const { data: walletSummary } = useQuery({
    queryKey: ["spin-wallet"],
    queryFn: async () => {
      const res = await authFetch("/api/spin/wallet");
      if (!res.ok) return { canWithdraw: false, totalWei: "0" };
      return res.json();
    },
    staleTime: 5_000,
  });

  const available = Number(data?.balance?.available ?? 0);
  const canMockWithdraw = Boolean(isFreePlay && walletSummary?.canWithdraw);
  const rpm = session?.rpm ?? data?.config?.baseWheelRpm ?? 120;

  const clearHuntTimer = () => {
    if (huntTimer.current) {
      window.clearTimeout(huntTimer.current);
      huntTimer.current = null;
    }
  };

  const finishHunt = useCallback(
    async (active: HuntSession) => {
      setFinishing(true);
      setHunting(false);
      clearHuntTimer();
      try {
        const res = await authFetch("/api/spins/session/finish", {
          method: "POST",
          body: JSON.stringify({ sessionId: active.sessionId }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Failed to finish hunt");

        const rewardLabel =
          body?.wheel?.reward ?? body?.wheel?.prize ?? SEGMENTS[Math.floor(Math.random() * TOTAL)].label;
        const segIdx = SEGMENTS.findIndex((s) => s.label === rewardLabel);
        const targetIdx = segIdx >= 0 ? segIdx : Math.floor(Math.random() * TOTAL);
        const targetAngle = 360 - (targetIdx * SLICE_DEG + SLICE_DEG / 2);
        const newRotation =
          prevRotation.current + 1800 + targetAngle - (prevRotation.current % 360);
        setRotation(newRotation);
        prevRotation.current = newRotation;

        window.setTimeout(() => {
          setReward(rewardLabel);
          setShowReward(true);
          setSession(null);
          setFinishing(false);
          queryClient.invalidateQueries({ queryKey: ["spin-hunt-config"] });
          queryClient.invalidateQueries({ queryKey: ["spin-history"] });
          queryClient.invalidateQueries({ queryKey: ["spins"] });
          queryClient.invalidateQueries({ queryKey: ["spin-wallet"] });
        }, 3200);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Finish failed");
        setFinishing(false);
      }
    },
    [queryClient]
  );

  const beginSession = useCallback(
    (payload: HuntSession) => {
      setSession(payload);
      setCashEarnedWei(payload.cashEarnedWei || "0");
      setCashAsset(payload.cashAsset || "USDm");
      setHunting(true);
      setShowReward(false);
      setReward(null);
      setError(null);
      clearHuntTimer();
      huntTimer.current = window.setTimeout(() => {
        void finishHunt(payload);
      }, payload.plan.durationMs + 200);
    },
    [finishHunt]
  );

  const startTicket = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/spins/session/start", {
        method: "POST",
        body: JSON.stringify({ useTicket: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 402 || body.code === "ENTRY_REQUIRED") {
        return { entryRequired: true as const, body };
      }
      if (!res.ok) throw new Error(body.error || "Failed to start hunt");
      return { entryRequired: false as const, body };
    },
    onSuccess: (result) => {
      if (result.entryRequired) {
        setError(`No free spins — pay ${feeLabel} to enter`);
        return;
      }
      const body = result.body;
      beginSession({
        sessionId: body.sessionId,
        cashEarnedWei: body.cashEarnedWei,
        cashAsset: body.cashAsset,
        startedAt: body.startedAt,
        expiresAt: body.expiresAt,
        rpm: body.rpm,
        plan: body.plan,
        loadout: body.loadout,
      });
    },
    onError: (e: Error) => setError(e.message),
  });

  const startPaid = useMutation({
    mutationFn: async () => {
      if (!isConnected) throw new Error("Connect wallet to pay entry");
      const paid = await payEntry({ asset: preferredAsset });
      const res = await authFetch("/api/spins/session/start", {
        method: "POST",
        body: JSON.stringify({
          useTicket: false,
          entryTxHash: paid.hash,
          sessionRef: paid.sessionRef,
          entryAsset: paid.asset,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to verify entry");
      return body;
    },
    onSuccess: (body) => {
      beginSession({
        sessionId: body.sessionId,
        cashEarnedWei: body.cashEarnedWei,
        cashAsset: body.cashAsset,
        startedAt: body.startedAt,
        expiresAt: body.expiresAt,
        rpm: body.rpm,
        plan: body.plan,
        loadout: body.loadout,
      });
    },
    onError: (e: Error) => setError(e.message),
  });

  const hitMutation = useMutation({
    mutationFn: async (input: { bubble: PublicBubble; taps: number; elapsedMs: number }) => {
      if (!session) throw new Error("No session");
      const res = await authFetch("/api/spins/session/hit", {
        method: "POST",
        body: JSON.stringify({
          sessionId: session.sessionId,
          bubbleId: input.bubble.id,
          taps: input.taps,
          clientElapsedMs: input.elapsedMs,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Hit rejected");
      return body;
    },
    onSuccess: (body) => {
      if (body.cashEarnedWei) setCashEarnedWei(body.cashEarnedWei);
      if (body.cashAsset) setCashAsset(body.cashAsset);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/spin/withdraw", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Withdraw failed");
      return body;
    },
    onSuccess: (body) => {
      showToast(body.message || "Successful withdraw");
      setCashEarnedWei("0");
      queryClient.invalidateQueries({ queryKey: ["spin-wallet"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const refillSpins = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/spin/freeplay", {
        method: "POST",
        body: JSON.stringify({ action: "refillSpins" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not refill spins");
      return body;
    },
    onSuccess: (body) => {
      setError(null);
      showToast(body.message || "Spins refilled");
      queryClient.invalidateQueries({ queryKey: ["spin-hunt-config"] });
      queryClient.invalidateQueries({ queryKey: ["spins"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const busy =
    hunting ||
    finishing ||
    startTicket.isPending ||
    startPaid.isPending ||
    paying ||
    withdrawMutation.isPending ||
    refillSpins.isPending;

  const spinLabel = useMemo(() => {
    if (finishing) return "…";
    if (hunting) return "Hunt";
    if (startTicket.isPending || startPaid.isPending || paying) return "…";
    return "Spin";
  }, [finishing, hunting, paying, startPaid.isPending, startTicket.isPending]);

  const handleSpin = () => {
    if (busy) return;
    setError(null);
    if (available > 0) {
      startTicket.mutate();
      return;
    }
    if (isFreePlay) {
      setError("No spins left — tap Try again to refill");
      return;
    }
    startPaid.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        <p className="text-xs font-black uppercase text-muted-foreground">Loading Hunt…</p>
      </div>
    );
  }

  return (
    <div>
      {showReward && reward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-xs rounded-3xl border-4 border-primary bg-zinc-900 p-8 text-center shadow-[0_0_40px_rgba(98,226,248,0.35),6px_6px_0_rgba(0,0,0,1)]">
            <button
              type="button"
              onClick={() => setShowReward(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10"
            >
              <X className="h-4 w-4 text-white" strokeWidth={2.5} />
            </button>
            <p className="mb-1 text-xs font-black uppercase tracking-widest text-white/60">
              Hunt complete
            </p>
            <p className="mb-2 font-black uppercase italic text-3xl leading-none text-primary">
              {reward}
            </p>
            <p className="mb-5 text-[11px] font-bold text-white/70">
              Bubbles: {formatCash(cashEarnedWei, cashAsset)}
            </p>
            {isFreePlay && BigInt(cashEarnedWei || "0") > 0n && (
              <button
                type="button"
                onClick={() => {
                  setShowReward(false);
                  withdrawMutation.mutate();
                }}
                disabled={withdrawMutation.isPending}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-black bg-[#FBBF24] py-3.5 text-sm font-black uppercase text-black shadow-[4px_4px_0_rgba(0,0,0,1)]"
              >
                <ArrowDownToLine className="h-4 w-4" strokeWidth={2.5} />
                Withdraw (demo)
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowReward(false)}
              className="w-full rounded-2xl border-4 border-black bg-primary py-3.5 text-sm font-black uppercase text-black shadow-[4px_4px_0_rgba(0,0,0,1)]"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 text-center">
        <h2 className="text-xl font-black uppercase italic">Spin Hunt</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Burst bubbles. Land the wheel. Skill first.
        </p>
      </div>

      {isFreePlay && (
        <div className="mb-3 rounded-xl border-2 border-[#FBBF24]/50 bg-[#FBBF24]/10 px-3 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FBBF24]">
            Free Play · Mock shop & withdraw · No funds at risk
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between rounded-2xl border-2 border-white/10 bg-zinc-900/80 p-3 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-primary/40 bg-primary/20">
            <Ticket className="h-4 w-4 text-primary" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-white/50">Free spins</p>
            <p className="text-base font-black tabular-nums">{available} Available</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-white/50">
              {isFreePlay ? "Demo claimable" : "Hunt cash"}
            </p>
            <p className="flex items-center justify-end gap-1 text-sm font-black text-primary">
              <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
              {formatCash(
                isFreePlay ? String(walletSummary?.totalWei ?? cashEarnedWei) : cashEarnedWei,
                cashAsset
              )}
            </p>
          </div>
          {canMockWithdraw && (
            <button
              type="button"
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-primary text-black shadow-[2px_2px_0_rgba(0,0,0,1)]"
              aria-label="Withdraw"
              title="Successful withdraw (demo)"
            >
              <ArrowDownToLine className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 flex flex-col items-center">
        <div className="mb-[-4px] z-10 h-0 w-0 border-l-[10px] border-r-[10px] border-b-[22px] border-l-transparent border-r-transparent border-b-yellow-400" />
        <SpinWheelPanel
          rotation={rotation}
          hunting={hunting}
          rpm={rpm}
          spinDisabled={busy}
          spinLabel={spinLabel}
          onSpin={handleSpin}
        />
      </div>

      {hunting && session && (
        <>
          {session.loadout?.musicUrl ? (
            <audio src={session.loadout.musicUrl} autoPlay loop preload="auto" className="hidden" />
          ) : null}
          <BubbleArena
            bubbles={session.plan.bubbles}
            startedAtMs={new Date(session.startedAt).getTime()}
            durationMs={session.plan.durationMs}
            disabled={hitMutation.isPending}
            onBurst={(bubble, taps, elapsedMs) =>
              hitMutation.mutate({ bubble, taps, elapsedMs })
            }
          />
        </>
      )}

      {!hunting && (
        <>
          <p className="mt-3 text-center text-[10px] font-bold text-muted-foreground">
            {available > 0
              ? "Tap center Spin to start a free hunt"
              : isFreePlay
                ? "No spins left — refill to keep testing"
                : `No free spins — entry ${feeLabel} via SpinEconomy`}
          </p>

          {isFreePlay && available <= 0 && (
            <button
              type="button"
              onClick={() => refillSpins.mutate()}
              disabled={refillSpins.isPending}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-black bg-[#FBBF24] py-3.5 text-sm font-black uppercase text-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)]"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
              {refillSpins.isPending ? "Refilling…" : "Try again"}
            </button>
          )}

          <SpinLoadoutPanel />
        </>
      )}

      {error && (
        <p className="mt-2 text-center text-[11px] font-bold text-red-400">{error}</p>
      )}

      {(history?.history?.length ?? 0) > 0 && (
        <section className="mt-4">
          <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            Recent drops
          </p>
          <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-zinc-900/80">
            {history.history.slice(0, 5).map((entry: { reward?: string; prize?: string; createdAt?: string }, i: number) => (
              <div key={i} className="flex items-center justify-between px-2.5 py-2">
                <div>
                  <p className="text-[10px] font-black">{entry.reward ?? entry.prize ?? "Reward"}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-primary">
                  Won
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
