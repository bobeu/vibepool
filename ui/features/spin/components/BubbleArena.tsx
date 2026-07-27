"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
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
  onBurst: (bubble: PublicBubble, taps: number, elapsedMs: number) => Promise<BurstResult | void>;
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

export function BubbleArena({ bubbles, startedAtMs, durationMs, disabled, onBurst }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [taps, setTaps] = useState<Record<string, number>>({});
  const [burstIds, setBurstIds] = useState<Set<string>>(new Set());
  const [flyouts, setFlyouts] = useState<Flyout[]>([]);

  useEffect(() => {
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
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1.5 bg-primary/20"
        aria-hidden
      >
        <div
          className="h-full bg-primary transition-[width] duration-75"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {live.map((b) => {
        const age = elapsed - b.spawnAtMs;
        const t = age / b.lifetimeMs;
        const angle = ((b.pathSeed % 360) * Math.PI) / 180;
        const distance = 48 + t * (160 + b.x * 2.4);
        const driftX = Math.sin((b.pathSeed % 97) + t * 8) * 18;
        const driftY = Math.cos((b.pathSeed % 83) + t * 7) * 14;
        const x = Math.cos(angle) * distance + driftX;
        const y = Math.sin(angle) * distance + driftY;
        const scale = 0.9 + Math.sin(t * Math.PI) * 0.18;

        return (
          <button
            key={b.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = (taps[b.id] ?? 0) + 1;
              setTaps((prev) => ({ ...prev, [b.id]: next }));
              if (next >= b.tapsRequired) {
                setBurstIds((prev) => new Set(prev).add(b.id));
                const createdAt = Date.now();
                void onBurst(b, next, elapsed)
                  .then((result) => {
                    if (!result?.amountWei || !result.asset) return;
                    setFlyouts((prev) => [
                      ...prev,
                      {
                        id: `${b.id}-${createdAt}`,
                        label: formatBurstAmount(result.amountWei, result.asset),
                        x,
                        y,
                      },
                    ]);
                    window.setTimeout(() => {
                      setFlyouts((prev) => prev.filter((entry) => entry.id !== `${b.id}-${createdAt}`));
                    }, 900);
                  })
                  .catch(() => undefined);
              }
            }}
            className={cn(
              "absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50",
              "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.55),rgba(98,226,248,0.35)_45%,rgba(24,154,180,0.75))]",
              "shadow-[0_0_22px_rgba(98,226,248,0.38)] active:scale-90 transition-transform",
              b.tapsRequired > 1 && "ring-2 ring-amber-300/70"
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
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: `translate(-50%, -50%) translate(${flyout.x}px, ${flyout.y}px)`,
          }}
        >
          <div className="animate-[bubble-flyout_900ms_ease-out_forwards] rounded-full border border-white/10 bg-zinc-950/85 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
            {flyout.label}
          </div>
        </div>
      ))}

      {live.length === 0 && elapsed < durationMs && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-full border border-white/10 bg-zinc-950/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/45">
            Watch the center…
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes bubble-flyout {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(0) scale(0.92);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-52px) scale(1.08);
          }
        }
      `}</style>
    </div>
  );
}
