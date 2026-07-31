"use client";

import React from "react";
import { Coins, Zap, Gem, Flame, Target, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/format";

type WheelSegment = {
  id: number;
  icon: LucideIcon;
  gradId: string;
  colorStart: string;
  colorEnd: string;
  textColor: string;
};

const SEGMENTS: readonly WheelSegment[] = [
  { id: 0, icon: Coins, gradId: "gradGreen", colorStart: "#34D399", colorEnd: "#059669", textColor: "#ffffff" },
  { id: 1, icon: Zap, gradId: "gradCyan", colorStart: "#22D3EE", colorEnd: "#0891B2", textColor: "#ffffff" },
  { id: 2, icon: Gem, gradId: "gradIndigo", colorStart: "#818CF8", colorEnd: "#4F46E5", textColor: "#ffffff" },
  { id: 3, icon: Flame, gradId: "gradRed", colorStart: "#F87171", colorEnd: "#DC2626", textColor: "#ffffff" },
  { id: 4, icon: Target, gradId: "gradTeal", colorStart: "#2DD4BF", colorEnd: "#0D9488", textColor: "#ffffff" },
  { id: 5, icon: Trophy, gradId: "gradGold", colorStart: "#FBBF24", colorEnd: "#D97706", textColor: "#ffffff" },
] as const;

const TOTAL = SEGMENTS.length;
const SLICE_DEG = 360 / TOTAL;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

type Props = {
  rotation: number;
  hunting: boolean;
  rpm: number;
  spinDisabled: boolean;
  spinLabel: string;
  onSpin: () => void;
};

export function SpinWheelPanel({
  rotation,
  hunting,
  rpm,
  spinDisabled,
  spinLabel,
  onSpin,
}: Props) {
  const CX = 160;
  const CY = 160;
  const R = 148;
  const spinSeconds = 60 / Math.max(rpm, 40);

  return (
    <div className="relative mx-auto h-[300px] w-[300px]">
      {/* Decorative outer glow ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          hunting
            ? "shadow-[0_0_48px_18px_rgba(98,226,248,0.22)]"
            : "shadow-[0_0_20px_8px_rgba(98,226,248,0.08)]",
          "transition-shadow duration-700"
        )}
        aria-hidden
      />

      {/* Spinning wheel SVG */}
      <svg
        width="300"
        height="300"
        viewBox="0 0 320 320"
        className={cn("absolute inset-0", hunting && "animate-spin")}
        style={{
          transformOrigin: "50% 50%",
          transform: hunting ? undefined : `rotate(${rotation}deg)`,
          transition: hunting
            ? undefined
            : "transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)",
          animationDuration: hunting ? `${spinSeconds}s` : undefined,
          filter: "drop-shadow(0 8px 28px rgba(0,0,0,0.55))",
        }}
        aria-hidden
      >
        <defs>
          <radialGradient id="goldRingHunt" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#F5D76E" />
            <stop offset="100%" stopColor="#8B6914" />
          </radialGradient>
          <radialGradient id="hubHunt" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
          {/* Custom gradients for segments */}
          {SEGMENTS.map((seg) => (
            <linearGradient id={seg.gradId} key={seg.gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={seg.colorStart} />
              <stop offset="100%" stopColor={seg.colorEnd} />
            </linearGradient>
          ))}
        </defs>

        {/* Outer gold ring */}
        <circle cx={CX} cy={CY} r={R + 8} fill="url(#goldRingHunt)" />

        {/* Wheel segments */}
        {SEGMENTS.map((seg, i) => {
          const start = i * SLICE_DEG;
          const end = start + SLICE_DEG;
          const mid = start + SLICE_DEG / 2;
          const labelPos = polarToCartesian(CX, CY, R * 0.65, mid);
          const Icon = seg.icon;
          return (
            <g key={seg.gradId}>
              <path d={describeSlice(CX, CY, R, start, end)} fill={`url(#${seg.gradId})`} />
              {/* Segment separator lines */}
              <line
                x1={CX}
                y1={CY}
                x2={polarToCartesian(CX, CY, R, start).x}
                y2={polarToCartesian(CX, CY, R, start).y}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="1.5"
              />
              <foreignObject
                x={labelPos.x - 14}
                y={labelPos.y - 14}
                width="28"
                height="28"
                transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
              >
                <div className="flex h-full w-full items-center justify-center text-white">
                  <Icon className="h-6 w-6 stroke-[3.5px] drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)]" />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Dark hub circle — the button sits on top of this visually */}
        <circle cx={CX} cy={CY} r={50} fill="url(#hubHunt)" />
        {/* Hub rim highlight */}
        <circle cx={CX} cy={CY} r={50} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      </svg>

      {/* Center clickable button — overlaid on hub, does not rotate */}
      <button
        type="button"
        onClick={onSpin}
        disabled={spinDisabled}
        className={cn(
          "absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2",
          "flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full",
          "border-[3px] text-[10px] font-black uppercase leading-tight tracking-widest",
          "transition-all duration-150 select-none",
          spinDisabled
            ? "cursor-not-allowed border-white/10 bg-zinc-900/80 text-white/30"
            : [
                "border-primary/60 bg-gradient-to-br from-zinc-900 to-zinc-950 text-primary",
                "shadow-[0_0_22px_rgba(98,226,248,0.35),inset_0_1px_0_rgba(255,255,255,0.07)]",
                "hover:border-primary hover:shadow-[0_0_32px_rgba(98,226,248,0.55)] hover:scale-[1.04]",
                "active:scale-[0.96] active:shadow-[0_0_12px_rgba(98,226,248,0.2)]",
              ]
        )}
        aria-label={spinLabel}
      >
        {/* Decorative ring inside button */}
        <span
          className="pointer-events-none absolute inset-2 rounded-full border border-primary/20"
          aria-hidden
        />
        <span className="relative z-10 text-[11px]">{spinLabel}</span>
      </button>
    </div>
  );
}

export { SEGMENTS, SLICE_DEG, TOTAL };
