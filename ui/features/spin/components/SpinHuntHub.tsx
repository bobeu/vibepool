"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, RotateCcw, Shield, Ticket, X, Zap } from "lucide-react";
import { formatUnits } from "viem";
import { authFetch, getAccessToken, startFreePlaySession } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useSpinEconomyPayment } from "@/hooks/useSpinEconomyPayment";
import { useUIStore } from "@/store/uiStore";
import { assetDecimals } from "@/lib/tokens/celoAssets";
import { isSpinPayAsset } from "@/lib/spin/economy";
import { unlockSpinAudio } from "@/lib/audio/spinSounds";
import type { HuntLoadout, HuntSession, PublicBubble } from "@/lib/spin/types";
import { BubbleArena } from "./BubbleArena";
import { SpinLoadoutPanel } from "./SpinLoadoutPanel";
import { SLICE_DEG, TOTAL, SpinWheelPanel } from "./SpinWheelPanel";

type CatalogItem = {
  id: string;
  name: string;
  type: string;
  slug?: string;
  priceWei: string;
  priceAsset: string;
  itemId: `0x${string}`;
  owned: boolean;
  quantity?: number;
};

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
  const { isFreePlay, isLoading: authLoading, refreshSession } = useAuth();
  const showToast = useUIStore((s) => s.showToast);
  const {
    payEntry,
    purchaseItem,
    busy: paying,
    preferredAsset,
    feeLabel,
    isConnected,
  } = useSpinEconomyPayment();

  const [session, setSession] = useState<HuntSession | null>(null);
  const [hunting, setHunting] = useState(false);
  const [cashEarnedWei, setCashEarnedWei] = useState("0");
  const [cashAsset, setCashAsset] = useState("USDm");
  const [rotation, setRotation] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStartMode, setPendingStartMode] = useState<"ticket" | "paid" | null>(null);
  const [applyInfo, setApplyInfo] = useState<"SPEED_SHIELDER" | "BUZZER" | null>(null);
  const prevRotation = useRef(0);
  const huntTimer = useRef<number | null>(null);

  useEffect(() => {
    if (authLoading || isConnected) return;
    if (getAccessToken()) return;
    void startFreePlaySession().then((ok) => {
      if (ok) void refreshSession();
    });
  }, [authLoading, isConnected, refreshSession]);

  const { data, isLoading } = useQuery({
    queryKey: ["spin-hunt-config"],
    queryFn: async () => {
      const res = await authFetch("/api/spins/config");
      if (!res.ok) throw new Error("Failed to load Spin Hunt");
      return res.json();
    },
    staleTime: 15_000,
    enabled: !authLoading && Boolean(getAccessToken()),
  });

  const { data: loadoutSummary } = useQuery({
    queryKey: ["spin-collections"],
    queryFn: async () => {
      const res = await authFetch("/api/spin/collections");
      if (!res.ok) return { loadout: null, items: [] };
      return res.json();
    },
    staleTime: 10_000,
    enabled: !authLoading && Boolean(getAccessToken()),
  });

  const { data: walletSummary } = useQuery({
    queryKey: ["spin-wallet"],
    queryFn: async () => {
      const res = await authFetch("/api/spin/wallet");
      if (!res.ok) return { canWithdraw: false, totalWei: "0" };
      return res.json();
    },
    staleTime: 5_000,
    enabled: !authLoading && Boolean(getAccessToken()),
  });

  const available = Number(data?.balance?.available ?? 0);
  const canMockWithdraw = Boolean(isFreePlay && walletSummary?.canWithdraw);
  const catalogItems = (loadoutSummary?.items ?? []) as CatalogItem[];
  const speedShielderItem =
    catalogItems.find((item) => item.type === "SPEED_SHIELDER") ??
    catalogItems.find((item) => item.slug === "speed-shielder-1");
  const quickBuzzerItem =
    catalogItems.find((item) => item.type === "BUZZER") ??
    catalogItems.find((item) => item.slug === "buzzer-1");
  const rpm =
    session?.rpm ??
    loadoutSummary?.loadout?.wheelRpm ??
    data?.config?.baseWheelRpm ??
    100;
  const activeLoadout = (session?.loadout ?? loadoutSummary?.loadout ?? null) as HuntLoadout | null;

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
        const finalCashWei = String(body?.cashEarnedWei ?? active.cashEarnedWei ?? "0");
        const finalAsset = String(body?.cashAsset ?? active.cashAsset ?? "USDm");
        setCashEarnedWei(finalCashWei);
        setCashAsset(finalAsset);

        const rewardLabel = formatCash(finalCashWei, finalAsset);
        const targetIdx = Math.floor(Math.random() * TOTAL);
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
          setPendingStartMode(null);
          setApplyInfo(null);
          queryClient.invalidateQueries({ queryKey: ["spin-hunt-config"] });
          queryClient.invalidateQueries({ queryKey: ["spin-collections"] });
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
      void unlockSpinAudio();
      setSession(payload);
      setCashEarnedWei(payload.cashEarnedWei || "0");
      setCashAsset(payload.cashAsset || "USDm");
      setHunting(true);
      setPendingStartMode(null);
      setApplyInfo(null);
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
    onError: (e: Error) => {
      setHunting(false);
      setSession(null);
      setError(e.message);
    },
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
      if (body.success === false) {
        throw new Error(body.error || body.message || "Hit rejected");
      }
      return body;
    },
    onSuccess: (body) => {
      if (body.cashEarnedWei) setCashEarnedWei(body.cashEarnedWei);
      if (body.cashAsset) setCashAsset(body.cashAsset);
    },
    onError: (e: Error) => {
      setError(e.message);
      showToast(e.message);
    },
  });

  const applyBoostMutation = useMutation({
    mutationFn: async (type: "SPEED_SHIELDER" | "BUZZER") => {
      const item = type === "SPEED_SHIELDER" ? speedShielderItem : quickBuzzerItem;
      if (!item) throw new Error(type === "SPEED_SHIELDER" ? "Speed Shielder not found" : "Quick Buzzer not found");

      if (isFreePlay || item.priceWei === "0") {
        const res = await authFetch(
          isFreePlay && item.priceWei !== "0" ? "/api/spin/freeplay" : "/api/spin/collections",
          {
            method: "POST",
            body: JSON.stringify(
              isFreePlay && item.priceWei !== "0"
                ? { action: "purchaseItem", itemId: item.id }
                : { action: "purchase", itemId: item.id, free: true }
            ),
          }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Apply failed");
        return { type, body };
      }

      if (!isConnected) throw new Error("Connect wallet to buy");
      const asset = isSpinPayAsset(item.priceAsset) ? item.priceAsset : preferredAsset;
      const paid = await purchaseItem({
        itemId: item.itemId,
        asset,
        amountWei: BigInt(item.priceWei),
      });
      const res = await authFetch("/api/spin/collections", {
        method: "POST",
        body: JSON.stringify({ action: "purchase", itemId: item.id, txHash: paid.hash }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Purchase verify failed");
      return { type, body };
    },
    onSuccess: ({ type, body }) => {
      setApplyInfo(type);
      setError(null);
      const nextRpm =
        body?.loadout?.wheelRpm ??
        loadoutSummary?.loadout?.wheelRpm ??
        data?.config?.baseWheelRpm ??
        100;
      if (session && body?.loadout) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                rpm: typeof body.loadout.wheelRpm === "number" ? body.loadout.wheelRpm : prev.rpm,
                loadout: body.loadout,
              }
            : prev
        );
      }
      showToast(
        type === "SPEED_SHIELDER"
          ? `Speed Shielder applied · ${nextRpm} RPM`
          : `Quick Buzzer applied · wheel ${nextRpm} RPM`
      );
      queryClient.invalidateQueries({ queryKey: ["spin-collections"] });
    },
    onError: (e: Error) => {
      setError(e.message);
      showToast(e.message);
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
    refillSpins.isPending ||
    applyBoostMutation.isPending;

  const spinLabel = useMemo(() => {
    if (finishing) return "…";
    if (hunting) return "Burst";
    if (startTicket.isPending || startPaid.isPending || paying) return "…";
    return "Spin";
  }, [finishing, hunting, paying, startPaid.isPending, startTicket.isPending]);

  useEffect(() => {
    if (pendingStartMode || session || showReward) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
    return undefined;
  }, [pendingStartMode, session, showReward]);

  const launchPendingStart = () => {
    if (startTicket.isPending || startPaid.isPending || applyBoostMutation.isPending) return;
    if (pendingStartMode === "ticket") {
      startTicket.mutate();
      return;
    }
    if (pendingStartMode === "paid") {
      if (!isConnected) {
        setError("Connect wallet to pay entry");
        showToast("Connect wallet to pay entry");
        return;
      }
      startPaid.mutate();
    }
  };

  const handleSpin = () => {
    if (busy || pendingStartMode) return;
    void unlockSpinAudio();
    setError(null);
    if (available > 0) {
      setPendingStartMode("ticket");
      return;
    }
    if (isFreePlay) {
      setError("No spins left — tap Try again to refill");
      return;
    }
    setPendingStartMode("paid");
  };

  const boostActions = (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={applyBoostMutation.isPending || startTicket.isPending || startPaid.isPending}
        onClick={() => {
          if (!speedShielderItem) {
            showToast("Speed Shielder unavailable — refresh and try again");
            return;
          }
          if (!isFreePlay && !isConnected && speedShielderItem.priceWei !== "0") {
            showToast("Connect wallet to buy Speed Shielder");
            return;
          }
          applyBoostMutation.mutate("SPEED_SHIELDER");
        }}
        className="rounded-2xl border-4 border-black bg-[#FBBF24] px-2 py-3 text-[10px] font-black uppercase leading-tight text-black shadow-[4px_4px_0_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-white/50"
      >
        <span className="mb-1 flex items-center justify-center gap-1">
          <Shield className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        Apply Speed Shielder
      </button>
      <button
        type="button"
        disabled={applyBoostMutation.isPending || startTicket.isPending || startPaid.isPending}
        onClick={() => {
          if (!quickBuzzerItem) {
            showToast("Quick Buzzer unavailable — refresh and try again");
            return;
          }
          if (!isFreePlay && !isConnected && quickBuzzerItem.priceWei !== "0") {
            showToast("Connect wallet to buy Quick Buzzer");
            return;
          }
          applyBoostMutation.mutate("BUZZER");
        }}
        className="rounded-2xl border-4 border-black bg-primary px-2 py-3 text-[10px] font-black uppercase leading-tight text-black shadow-[4px_4px_0_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-white/50"
      >
        <span className="mb-1 flex items-center justify-center gap-1">
          <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        Apply Quick Buzzer
      </button>
    </div>
  );

  const applyInfoBlurb =
    applyInfo === "SPEED_SHIELDER" ? (
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Speed Shielder</p>
        <p className="mt-1 text-sm font-bold text-white/80">
          Slows the wheel by 2 RPM per stack. Stack more for a calmer hunt.
        </p>
        <p className="mt-1 text-[11px] font-bold text-white/55">
          Qty {activeLoadout?.speedShielderQty ?? 0} · live {rpm} RPM
        </p>
      </div>
    ) : applyInfo === "BUZZER" ? (
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Quick Buzzer</p>
        <p className="mt-1 text-sm font-bold text-white/80">
          Reduces taps needed on tough bubbles — each stack saves a tap.
        </p>
        <p className="mt-1 text-[11px] font-bold text-white/55">
          Bonus {activeLoadout?.buzzerTapBonus ?? 0} tap
          {(activeLoadout?.buzzerTapBonus ?? 0) === 1 ? "" : "s"}
        </p>
      </div>
    ) : null;

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
      {pendingStartMode && (
        <div className="fixed inset-0 z-[185] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border-4 border-primary bg-zinc-950 p-6 text-center shadow-[0_0_48px_rgba(98,226,248,0.25)]">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary/80">
              Spin Hunt ready
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-primary">{rpm} RPM</p>
            <h3 className="mt-2 text-2xl font-black uppercase italic text-white">
              Boost your wheel
            </h3>
            <p className="mt-3 text-sm font-bold text-white/70">
              Apply a Speed Shielder to calm RPM, or a Quick Buzzer to crack tough bubbles faster.
            </p>

            {applyInfoBlurb}

            <div className="mt-5 flex flex-col gap-3">
              {boostActions}
              <button
                type="button"
                onClick={launchPendingStart}
                disabled={startTicket.isPending || startPaid.isPending || applyBoostMutation.isPending}
                className="w-full rounded-2xl border-4 border-black bg-primary py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-white/50"
              >
                {startTicket.isPending || startPaid.isPending ? "Starting…" : "Start hunt"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingStartMode(null);
                  setApplyInfo(null);
                }}
                className="text-xs font-black uppercase tracking-widest text-white/55"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

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
              Round total banked from burst bubbles
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
          {isFreePlay && (
            <button
              type="button"
              onClick={() => refillSpins.mutate()}
              disabled={refillSpins.isPending}
              className="rounded-xl border-2 border-black bg-[#FBBF24] px-2.5 py-1.5 text-[9px] font-black uppercase text-black shadow-[2px_2px_0_rgba(0,0,0,1)]"
            >
              {refillSpins.isPending ? "…" : "Refill"}
            </button>
          )}
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
        <div className="relative mb-1 flex w-full max-w-[280px] items-end justify-center">
          <p className="absolute left-0 bottom-1 text-sm font-black tabular-nums text-primary">
            {rpm} RPM
          </p>
          <div className="mb-[-4px] z-10 h-0 w-0 border-l-[10px] border-r-[10px] border-b-[22px] border-l-transparent border-r-transparent border-b-yellow-400" />
        </div>
        <SpinWheelPanel
          rotation={rotation}
          hunting={hunting}
          rpm={rpm}
          spinDisabled={busy || !!pendingStartMode}
          spinLabel={spinLabel}
          onSpin={handleSpin}
        />
      </div>

      {session && (hunting || finishing) && (
        <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm">
          {session.loadout?.musicUrl ? (
            <audio src={session.loadout.musicUrl} autoPlay loop preload="auto" className="hidden" />
          ) : null}
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            {/* Wheel sits under the bubble layer so bursts stay clickable. */}
            <div className="pointer-events-none relative z-10 flex flex-col items-center">
              <div className="relative mb-1 flex w-full min-w-[240px] items-end justify-center">
                <p className="absolute left-0 bottom-1 text-sm font-black tabular-nums text-primary">
                  {rpm} RPM
                </p>
                <div className="mb-[-4px] h-0 w-0 border-l-[10px] border-r-[10px] border-b-[22px] border-l-transparent border-r-transparent border-b-yellow-400" />
              </div>
              <SpinWheelPanel
                rotation={rotation}
                hunting={hunting}
                rpm={rpm}
                spinDisabled
                spinLabel={spinLabel}
                onSpin={() => undefined}
              />
              <p className="mt-4 rounded-full border border-white/10 bg-zinc-950/75 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/65">
                {finishing ? "Locking round…" : "Pop bubbles before they escape"}
              </p>
            </div>

            <BubbleArena
              bubbles={session.plan.bubbles}
              startedAtMs={new Date(session.startedAt).getTime()}
              durationMs={session.plan.durationMs}
              emitOffsetY={-42}
              disabled={finishing}
              onBurst={(bubble, taps, elapsedMs) =>
                hitMutation.mutateAsync({ bubble, taps, elapsedMs })
              }
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 z-[80] px-4 py-4">
              <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-3">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/80">
                    Bubble mode
                  </p>
                  <p className="mt-1 text-sm font-black uppercase text-white">
                    {finishing ? "Counting your burst total…" : "Bubbles emit from Spin · tap to burst"}
                  </p>
                  <p className="mt-2 text-lg font-black tabular-nums text-primary">{rpm} RPM</p>
                </div>
                <div className="pointer-events-auto flex max-w-[220px] flex-col items-end gap-2">
                  {boostActions}
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/55">
                      Bursting now
                    </p>
                    <p className="text-lg font-black text-primary">
                      {formatCash(cashEarnedWei, cashAsset)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {applyInfoBlurb ? (
              <div className="pointer-events-none absolute inset-x-4 top-28 z-[85] mx-auto max-w-md">
                {applyInfoBlurb}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {!hunting && (
        <>
          <p className="mt-3 text-center text-[10px] font-bold text-muted-foreground">
            {available > 0
              ? "Tap center Spin to start a free hunt"
              : isFreePlay
                ? "No spins left — tap Refill or Try again below"
                : `No free spins — entry ${feeLabel} via SpinEconomy`}
          </p>

          {isFreePlay && (
            <button
              type="button"
              onClick={() => refillSpins.mutate()}
              disabled={refillSpins.isPending}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-black bg-[#FBBF24] py-3.5 text-sm font-black uppercase text-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)]"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
              {refillSpins.isPending
                ? "Refilling…"
                : available <= 0
                  ? "Try again · Refill spins"
                  : "Top up spins (demo)"}
            </button>
          )}
          <SpinLoadoutPanel />
        </>
      )}

      {error && (
        <p className="mt-2 text-center text-[11px] font-bold text-red-400">{error}</p>
      )}
    </div>
  );
}
