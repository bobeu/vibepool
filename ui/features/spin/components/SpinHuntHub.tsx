"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, RotateCcw, Shield, Ticket, X, Zap } from "lucide-react";
import { formatUnits } from "viem";
import { authFetch, startFreePlaySession } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useSpinEconomyPayment } from "@/hooks/useSpinEconomyPayment";
import { useUIStore } from "@/store/uiStore";
import { assetDecimals, type SpinPayAsset } from "@/lib/tokens/celoAssets";
import { isSpinPayAsset } from "@/lib/spin/economy";
import { unlockSpinAudio } from "@/lib/audio/spinSounds";
import { canRefillOrBuyDemoSpins } from "@/lib/spin/freePlay";
import type { HuntLoadout, HuntSession, PublicBubble } from "@/lib/spin/types";
import { BubbleArena } from "./BubbleArena";
import { SpinLoadoutPanel } from "./SpinLoadoutPanel";
import { SLICE_DEG, TOTAL, SpinWheelPanel } from "./SpinWheelPanel";
import { AppOverlay } from "@/components/layout/AppOverlay";
import { useAccount } from "wagmi";
import { cn } from "@/utils/format";

const REWARD_ASSETS: SpinPayAsset[] = ["CELO", "USDm", "USDC", "USDT"];
const REWARD_ASSET_KEY = "nexora_spin_reward_asset";

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

function readStoredRewardAsset(fallback: SpinPayAsset): SpinPayAsset {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(REWARD_ASSET_KEY);
    if (raw && isSpinPayAsset(raw)) return raw;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function SpinHuntHub() {
  const queryClient = useQueryClient();
  const {
    isFreePlay,
    isLoading: authLoading,
    refreshSession,
    session: authSession,
  } = useAuth();
  const { address, isConnected: wagmiConnected } = useAccount();
  const showToast = useUIStore((s) => s.showToast);
  const {
    payEntry,
    purchaseItem,
    withdrawPrize,
    busy: paying,
    preferredAsset,
    feeLabelFor,
    isConnected,
  } = useSpinEconomyPayment();

  // Free mode only while disconnected; connecting switches to pay mode.
  const inFreeMode = Boolean(isFreePlay && !wagmiConnected && !isConnected);
  const canAdminRefill = Boolean(address && canRefillOrBuyDemoSpins(address));
  const showRefill = canAdminRefill;

  const [selectedAsset, setSelectedAsset] = useState<SpinPayAsset>(preferredAsset);
  const [session, setSession] = useState<HuntSession | null>(null);
  const [hunting, setHunting] = useState(false);
  const [cashEarnedWei, setCashEarnedWei] = useState("0");
  const [cashAsset, setCashAsset] = useState<string>(preferredAsset);
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
    setSelectedAsset(readStoredRewardAsset(preferredAsset));
  }, [preferredAsset]);

  useEffect(() => {
    if (!hunting && !session) setCashAsset(selectedAsset);
  }, [hunting, selectedAsset, session]);

  const feeLabel = feeLabelFor(selectedAsset);

  useEffect(() => {
    if (authLoading || isConnected || authSession) return;
    void startFreePlaySession().then((ok) => {
      if (ok) void refreshSession();
    });
  }, [authLoading, isConnected, authSession, refreshSession]);

  const { data, isLoading } = useQuery({
    queryKey: ["spin-hunt-config"],
    queryFn: async () => {
      const res = await authFetch("/api/spins/config");
      if (!res.ok) throw new Error("Failed to load Spin Hunt");
      return res.json();
    },
    staleTime: 15_000,
    enabled: !authLoading && Boolean(authSession),
  });

  const { data: loadoutSummary } = useQuery({
    queryKey: ["spin-collections"],
    queryFn: async () => {
      const res = await authFetch("/api/spin/collections");
      if (!res.ok) return { loadout: null, items: [] };
      return res.json();
    },
    staleTime: 10_000,
    enabled: !authLoading && Boolean(authSession),
  });

  const { data: walletSummary } = useQuery({
    queryKey: ["spin-wallet"],
    queryFn: async () => {
      const res = await authFetch("/api/spin/wallet");
      if (!res.ok) return { canWithdraw: false, totalWei: "0" };
      return res.json();
    },
    staleTime: 5_000,
    enabled: !authLoading && Boolean(authSession),
  });

  const { data: vaultStatus, isFetching: vaultStatusLoading } = useQuery({
    queryKey: ["spin-vault-status", selectedAsset],
    queryFn: async () => {
      const res = await authFetch(`/api/spin/vault-status?asset=${selectedAsset}`);
      if (!res.ok) return { asset: selectedAsset, sufficient: true, checked: false };
      return res.json() as Promise<{ asset: string; sufficient: boolean; checked: boolean }>;
    },
    staleTime: 8_000,
    refetchInterval: 20_000,
    enabled: !authLoading && Boolean(authSession) && !inFreeMode,
  });

  const vaultReady = inFreeMode || vaultStatus?.sufficient !== false;
  const reserveNotice =
    !inFreeMode && vaultStatus?.sufficient === false
      ? `${selectedAsset} prize reserve is too low right now. Pick another currency or wait for a vault top-up.`
      : null;

  const available = Number(data?.balance?.available ?? 0);
  const withdrawable = Object.entries(
    (walletSummary?.byAsset ?? {}) as Record<
      string,
      { amountWei: string; canWithdraw: boolean }
    >
  ).find(
    ([asset, summary]) =>
      isSpinPayAsset(asset) && summary.canWithdraw && BigInt(summary.amountWei || "0") > 0n
  );
  const canWithdraw = Boolean(walletSummary?.canWithdraw && (inFreeMode || withdrawable));
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
      if (!inFreeMode && !vaultReady) {
        throw new Error(reserveNotice || "Prize reserve unavailable");
      }
      const res = await authFetch("/api/spins/session/start", {
        method: "POST",
        body: JSON.stringify({
          useTicket: true,
          rewardAsset: selectedAsset,
        }),
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
      if (!vaultReady) throw new Error(reserveNotice || "Prize reserve unavailable");
      const paid = await payEntry({ asset: selectedAsset });
      const res = await authFetch("/api/spins/session/start", {
        method: "POST",
        body: JSON.stringify({
          useTicket: false,
          entryTxHash: paid.hash,
          sessionRef: paid.sessionRef,
          entryAsset: paid.asset,
          rewardAsset: paid.asset,
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

      if (inFreeMode || item.priceWei === "0") {
        const res = await authFetch(
          inFreeMode && item.priceWei !== "0" ? "/api/spin/freeplay" : "/api/spin/collections",
          {
            method: "POST",
            body: JSON.stringify(
              inFreeMode && item.priceWei !== "0"
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
      const asset = isSpinPayAsset(item.priceAsset) ? item.priceAsset : selectedAsset;
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
      let payload: Record<string, string> | undefined;
      if (!inFreeMode) {
        if (!withdrawable) throw new Error("No on-chain reward is ready to withdraw");
        const [asset, summary] = withdrawable;
        if (!isSpinPayAsset(asset)) throw new Error("Invalid withdraw asset");
        const withdrawn = await withdrawPrize({
          asset,
          amountWei: BigInt(summary.amountWei),
        });
        payload = {
          txHash: withdrawn.hash,
          asset,
          amountWei: summary.amountWei,
        };
      }
      const res = await authFetch("/api/spin/withdraw", {
        method: "POST",
        body: payload ? JSON.stringify(payload) : undefined,
      });
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
    return "Start";
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
    if (!inFreeMode && !vaultReady) {
      setError(reserveNotice || "Prize reserve unavailable for this currency");
      showToast(reserveNotice || "Prize reserve unavailable");
      return;
    }
    if (available > 0) {
      setPendingStartMode("ticket");
      return;
    }
    if (inFreeMode) {
      setError(
        showRefill
          ? "No spins left — tap Refill"
          : "No free spins left (max 5). Connect a wallet to play in pay mode."
      );
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
          if (!inFreeMode && !isConnected && speedShielderItem.priceWei !== "0") {
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
          if (!inFreeMode && !isConnected && quickBuzzerItem.priceWei !== "0") {
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
        <AppOverlay>
          <div className="absolute inset-0 z-[185] flex items-end justify-center bg-black/80 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-zinc-950/95 p-6 text-center shadow-[0_0_60px_rgba(98,226,248,0.2)] ring-2 ring-primary/30">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/70">Spin Hunt</p>
                  <p className="text-2xl font-black tabular-nums text-white">{rpm} RPM</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPendingStartMode(null); setApplyInfo(null); }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

              <p className="mb-4 text-sm font-bold text-white/70 text-left">
                Optionally apply boosts before hunt. Speed Shielder slows the wheel (-2 RPM each). Quick Buzzer reduces taps needed to burst bubbles.
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
              </div>
            </div>
          </div>
        </AppOverlay>
      )}

      {showReward && reward && (
        <AppOverlay>
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
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
            {canWithdraw && (
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
                {inFreeMode ? "Withdraw (demo)" : "Withdraw reward"}
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
        </AppOverlay>
      )}

      <div className="mb-4 text-center">
        <h2 className="text-xl font-black uppercase italic">Spin Hunt</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Burst bubbles. Land the wheel. Skill first.
        </p>
      </div>

      {inFreeMode && (
        <div className="mb-3 rounded-xl border-2 border-[#FBBF24]/50 bg-[#FBBF24]/10 px-3 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FBBF24]">
            Free Play · Max 5 spins · No funds at risk
          </p>
        </div>
      )}
      {!inFreeMode && isConnected && (
        <div className="mb-3 rounded-xl border-2 border-primary/40 bg-primary/10 px-3 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
            Pay mode · Welcome spins (max 3) then entry fee
          </p>
        </div>
      )}

      {!hunting && (
        <div className="mb-3 rounded-2xl border-2 border-white/10 bg-zinc-900/80 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/50">
              Reward currency
            </p>
            {vaultStatusLoading ? (
              <p className="text-[9px] font-bold uppercase text-white/40">Checking reserve…</p>
            ) : reserveNotice ? (
              <p className="text-[9px] font-bold uppercase text-amber-300">Reserve low</p>
            ) : (
              <p className="text-[9px] font-bold uppercase text-primary">Ready</p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {REWARD_ASSETS.map((asset) => (
              <button
                key={asset}
                type="button"
                disabled={busy || !!pendingStartMode}
                onClick={() => {
                  setSelectedAsset(asset);
                  try {
                    localStorage.setItem(REWARD_ASSET_KEY, asset);
                  } catch {
                    /* ignore */
                  }
                  setError(null);
                }}
                className={cn(
                  "rounded-xl border-2 px-1 py-2 text-[10px] font-black uppercase transition-all",
                  selectedAsset === asset
                    ? "border-black bg-primary text-black shadow-[2px_2px_0_rgba(0,0,0,1)]"
                    : "border-white/15 bg-zinc-950 text-white/70 hover:border-white/30"
                )}
              >
                {asset}
              </button>
            ))}
          </div>
          {reserveNotice ? (
            <p className="mt-2 text-[10px] font-bold leading-relaxed text-amber-300">{reserveNotice}</p>
          ) : (
            <p className="mt-2 text-[10px] font-bold text-white/45">
              Bubbles and claimable rewards pay in {selectedAsset}
              {!inFreeMode ? ` · entry ${feeLabel}` : ""}.
            </p>
          )}
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
          {showRefill && (
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
              Claimable {isSpinPayAsset(cashAsset) ? cashAsset : selectedAsset}
            </p>
            <p className="flex items-center justify-end gap-1 text-sm font-black text-primary">
              <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
              {formatCash(
                inFreeMode ? String(walletSummary?.totalWei ?? cashEarnedWei) : cashEarnedWei,
                isSpinPayAsset(cashAsset) ? cashAsset : selectedAsset
              )}
            </p>
          </div>
          {canWithdraw && (
            <button
              type="button"
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-primary text-black shadow-[2px_2px_0_rgba(0,0,0,1)]"
              aria-label="Withdraw"
              title={inFreeMode ? "Withdraw demo reward" : "Withdraw on-chain reward"}
            >
              <ArrowDownToLine className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 flex flex-col items-center">
        <SpinWheelPanel
          rotation={rotation}
          hunting={hunting}
          rpm={rpm}
          spinDisabled={busy || !!pendingStartMode || (!inFreeMode && !vaultReady)}
          spinLabel={spinLabel}
          onSpin={handleSpin}
        />
      </div>

      {session && (hunting || finishing) && (
        <AppOverlay>
          <div className="absolute inset-0 z-[95] bg-black/80 backdrop-blur-sm">
            {session.loadout?.musicUrl ? (
              <audio src={session.loadout.musicUrl} autoPlay loop preload="auto" className="hidden" />
            ) : null}
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              {/* Wheel sits under the bubble layer so bursts stay clickable. */}
              <div className="pointer-events-none relative z-10 flex flex-col items-center">
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
                rpm={rpm}
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
        </AppOverlay>
      )}

      {!hunting && (
        <>
          <p className="mt-3 text-center text-[10px] font-bold text-muted-foreground">
            {available > 0
              ? inFreeMode
                ? "Tap center Spin to start a free hunt"
                : "Tap Spin — uses a welcome spin or paid entry"
              : inFreeMode
                ? showRefill
                  ? "No spins left — tap Refill"
                  : "Free spins used up (max 5). Connect wallet for pay mode."
                : `No free spins — entry ${feeLabel} via SpinEconomy`}
          </p>

          {showRefill && (
            <button
              type="button"
              onClick={() => refillSpins.mutate()}
              disabled={refillSpins.isPending}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-black bg-[#FBBF24] py-3.5 text-sm font-black uppercase text-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)]"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
              {refillSpins.isPending ? "Refilling…" : "Refill spins (tester)"}
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
