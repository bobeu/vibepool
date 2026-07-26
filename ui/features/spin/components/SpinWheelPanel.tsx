"use client";

import { cn } from "@/utils/format";

const SEGMENTS = [
  { label: "25 USDT", icon: "T", color: "#16C784", darkColor: "#0f9962", textColor: "#fff" },
  { label: "500 XP", icon: "XP", color: "#62E2F8", darkColor: "#189AB4", textColor: "#000" },
  { label: "10 USDC", icon: "S", color: "#1E90FF", darkColor: "#1565C0", textColor: "#fff" },
  { label: "5 USDm", icon: "M", color: "#FF9F1C", darkColor: "#C06000", textColor: "#000" },
  { label: "100 XP", icon: "XP", color: "#2DD4BF", darkColor: "#0F766E", textColor: "#000" },
  { label: "0.5 CELO", icon: "C", color: "#FBBF24", darkColor: "#B45309", textColor: "#000" },
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
      <svg
        width="300"
        height="300"
        viewBox="0 0 320 320"
        className={cn("absolute inset-0", hunting && "animate-spin")}
        style={{
          // Keep a stable transform origin so stopping hunt doesn't "jump" sideways.
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
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={R + 8} fill="url(#goldRingHunt)" />
        {SEGMENTS.map((seg, i) => {
          const start = i * SLICE_DEG;
          const end = start + SLICE_DEG;
          const mid = start + SLICE_DEG / 2;
          const labelPos = polarToCartesian(CX, CY, R * 0.62, mid);
          return (
            <g key={seg.label}>
              <path d={describeSlice(CX, CY, R, start, end)} fill={seg.color} />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10.5"
                fontWeight="900"
                fontFamily="Space Grotesk, sans-serif"
                fill={seg.textColor}
                transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
              >
                {seg.label}
              </text>
            </g>
          );
        })}
        <circle cx={CX} cy={CY} r={46} fill="url(#hubHunt)" />
      </svg>

      <button
        type="button"
        onClick={onSpin}
        disabled={spinDisabled}
        className={cn(
          "absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2",
          "h-[84px] w-[84px] rounded-full border-4 border-black font-black uppercase text-sm",
          "shadow-[4px_4px_0_rgba(0,0,0,1)] transition-transform",
          spinDisabled
            ? "cursor-not-allowed bg-zinc-700 text-white/50"
            : "bg-primary text-black hover:scale-[1.04] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)]"
        )}
        aria-label={spinLabel}
      >
        {spinLabel}
      </button>
    </div>
  );
}

export { SEGMENTS, SLICE_DEG, TOTAL };
