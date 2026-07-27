"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { playBubbleBurst, unlockSpinAudio } from "@/lib/audio/spinSounds";
import { isSpinPayAsset } from "@/lib/spin/economy";
import { assetDecimals } from "@/lib/tokens/celoAssets";
import { cn } from "@/utils/format";
import type { PublicBubble } from "@/lib/spin/types";

type BurstResult = {
  amountWei?: string;
  asset?: string;
};

type Props = {
  bubbles: PublicBubble[];
  startedAtMs: number;
  durationMs: number;
  disabled?: boolean;
  /** Pixels above the arena center — top edge of the Spin hub button (~42). */
  emitOffsetY?: number;
  onBurst: (bubble: PublicBubble, taps: number, elapsedMs: number) => Promise<BurstResult | void>;
  onBurstError?: (message: string, bubble: PublicBubble) => void;
};

type Flyout = {
  id: string;
  label: string;
  x: number;
  y: number;
};

function formatBurstAmount(amountWei: string, asset: string) {
  if (!isSpinPayAsset(asset)) return `+${amountWei} ${asset}`;
  try {
    const amount = Number(formatUnits(BigInt(amountWei || "0"), assetDecimals(asset)));
    if (amount === 0) return `+0 ${asset}`;
    return `+${amount < 0.0001 ? amount.toExponential(2) : amount.toPrecision(3)} ${asset}`;
  } catch {
    return `+${amountWei} ${asset}`;
  }
}

export function BubbleArena({
  bubbles,
  startedAtMs,
  durationMs,
  disabled,
  emitOffsetY = -42,
  onBurst,
  onBurstError,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [taps, setTaps] = useState<Record<string, number>>({});
  const [burstIds, setBurstIds] = useState<Set<string>>(new Set());
  const [flyouts, setFlyouts] = useState<Flyout[]>([]);

  useEffect(() => {
    void unlockSpinAudio();
    const id = window.setInterval(() => setNow(Date.now()), 50);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setTaps({});
    setBurstIds(new Set());
    setFlyouts([]);
  }, [startedAtMs]);

  const elapsed = Math.max(0, now - startedAtMs);

  const live = useMemo(() => {
    return bubbles.filter((b) => {
      if (burstIds.has(b.id)) return false;
      return elapsed >= b.spawnAtMs && elapsed <= b.spawnAtMs + b.lifetimeMs;
    });
  }, [bubbles, burstIds, elapsed]);

  const progress = Math.min(1, elapsed / Math.max(durationMs, 1));

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[60] h-1.5 bg-primary/20"
        aria-hidden
      >
        <div
          className="h-full bg-primary transition-[width] duration-75"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Emit origin: top of the Spin button (centered horizontally, offset upward). */}
      <div
        className="absolute left-1/2 top-1/2 h-0 w-0"
        style={{ transform: `translate(-50%, calc(-50% + ${emitOffsetY}px))` }}
      >
        {live.map((b) => {
          const age = elapsed - b.spawnAtMs;
          const t = Math.min(1, age / Math.max(b.lifetimeMs, 1));
          // Fan out from the Spin button top in all directions, with a slight upward bias.
          const angle = ((b.pathSeed % 360) * Math.PI) / 180 - Math.PI / 2;
          const distance = 8 + t * (120 + b.x * 1.8);
          const driftX = Math.sin((b.pathSeed % 97) + t * 7) * 14;
          const driftY = Math.cos((b.pathSeed % 83) + t * 6) * 10;
          const x = Math.cos(angle) * distance + driftX;
          const y = Math.sin(angle) * distance + driftY;
          const scale = 0.88 + Math.sin(t * Math.PI) * 0.22;

          return (
            <button
              key={b.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                void unlockSpinAudio();
                const next = (taps[b.id] ?? 0) + 1;
                setTaps((prev) => ({ ...prev, [b.id]: next }));
                if (next < b.tapsRequired) return;

                setBurstIds((prev) => new Set(prev).add(b.id));
                playBubbleBurst();

                const flyoutId = `${b.id}-${Date.now()}`;
                // Optimistic placeholder until the server returns the real amount.
                setFlyouts((prev) => [
                  ...prev,
                  { id: flyoutId, label: "…", x, y },
                ]);

                void onBurst(b, next, elapsed)
                  .then((result) => {
                    if (result?.amountWei && result.asset) {
                      const label = formatBurstAmount(result.amountWei, result.asset);
                      setFlyouts((prev) =>
                        prev.map((entry) =>
                          entry.id === flyoutId ? { ...entry, label } : entry
                        )
                      );
                    }
                    window.setTimeout(() => {
                      setFlyouts((prev) => prev.filter((entry) => entry.id !== flyoutId));
                    }, 1100);
                  })
                  .catch((err: unknown) => {
                    // Rollback optimistic burst so the player can retry.
                    setBurstIds((prev) => {
                      const nextIds = new Set(prev);
                      nextIds.delete(b.id);
                      return nextIds;
                    });
                    setTaps((prev) => {
                      const copy = { ...prev };
                      const restored = Math.max(0, (copy[b.id] ?? next) - 1);
                      if (restored <= 0) delete copy[b.id];
                      else copy[b.id] = restored;
                      return copy;
                    });
                    setFlyouts((prev) => prev.filter((entry) => entry.id !== flyoutId));
                    const message = err instanceof Error ? err.message : "Burst failed";
                    onBurstError?.(message, b);
                  });
              }}
              className={cn(
                "pointer-events-auto absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/55",
                "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.65),rgba(98,226,248,0.4)_45%,rgba(24,154,180,0.85))]",
                "shadow-[0_0_24px_rgba(98,226,248,0.45)] active:scale-90",
                "z-[55] cursor-pointer touch-manipulation",
                b.tapsRequired > 1 && "ring-2 ring-amber-300/80"
              )}
              style={{
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`,
              }}
              aria-label="Burst bubble"
            />
          );
        })}

        {flyouts.map((flyout) => (
          <div
            key={flyout.id}
            className="pointer-events-none absolute z-[70] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: 0,
              top: 0,
              transform: `translate(-50%, -50%) translate(${flyout.x}px, ${flyout.y - 18}px)`,
            }}
          >
            <div className="bubble-flyout rounded-full border-2 border-primary/40 bg-zinc-950/95 px-3 py-1.5 text-[12px] font-black uppercase tracking-wide text-primary shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
              {flyout.label}
            </div>
          </div>
        ))}
      </div>

      {live.length === 0 && elapsed < durationMs && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p
            className="rounded-full border border-white/10 bg-zinc-950/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/45"
            style={{ transform: `translateY(${emitOffsetY - 72}px)` }}
          >
            Bubbles rising from Spin…
          </p>
        </div>
      )}
    </div>
  );
}
