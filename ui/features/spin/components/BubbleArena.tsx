"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/format";
import type { PublicBubble } from "@/features/spin/types";

type Props = {
  bubbles: PublicBubble[];
  startedAtMs: number;
  durationMs: number;
  disabled?: boolean;
  onBurst: (bubble: PublicBubble, taps: number, elapsedMs: number) => void;
};

export function BubbleArena({ bubbles, startedAtMs, durationMs, disabled, onBurst }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [taps, setTaps] = useState<Record<string, number>>({});
  const [burstIds, setBurstIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 50);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = Math.max(0, now - startedAtMs);

  const live = useMemo(() => {
    return bubbles.filter((b) => {
      if (burstIds.has(b.id)) return false;
      return elapsed >= b.spawnAtMs && elapsed <= b.spawnAtMs + b.lifetimeMs;
    });
  }, [bubbles, burstIds, elapsed]);

  const progress = Math.min(1, elapsed / Math.max(durationMs, 1));

  return (
    <div className="relative mt-3 h-44 w-full overflow-hidden rounded-2xl border-2 border-white/10 bg-gradient-to-b from-zinc-900/40 via-[#0c1a22] to-zinc-950">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary/30"
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
        const y = 12 + ((b.pathSeed % 70) / 70) * 58 + Math.sin(t * Math.PI * 2 + b.pathSeed) * 10;
        const drift = Math.sin((b.pathSeed % 97) + t * 6) * 6;
        const scale = 0.85 + Math.sin(t * Math.PI) * 0.25;

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
                onBurst(b, next, elapsed);
              }
            }}
            className={cn(
              "absolute h-11 w-11 -translate-x-1/2 rounded-full border-2 border-white/40",
              "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.55),rgba(98,226,248,0.35)_45%,rgba(24,154,180,0.75))]",
              "shadow-[0_0_18px_rgba(98,226,248,0.35)] active:scale-90 transition-transform",
              b.tapsRequired > 1 && "ring-2 ring-amber-300/70"
            )}
            style={{
              left: `calc(${b.x}% + ${drift}px)`,
              top: `${y}%`,
              transform: `translateX(-50%) scale(${scale})`,
            }}
            aria-label="Burst bubble"
          />
        );
      })}

      {live.length === 0 && elapsed < durationMs && (
        <p className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white/40">
          Watch for bubbles…
        </p>
      )}
    </div>
  );
}
