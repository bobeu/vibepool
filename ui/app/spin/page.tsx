"use client";

import React, { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { authFetch } from "@/lib/auth/client";
import { cn } from "@/utils/format";
import { Clock, X, Ticket } from "lucide-react";

// ─── Wheel Segments ───────────────────────────────────────────────────────────

const SEGMENTS = [
  { label: "25 USDT", icon: "T", color: "#16C784", darkColor: "#0f9962", textColor: "#fff", rarity: "Common" },
  { label: "500 XP",  icon: "💎", color: "#62E2F8", darkColor: "#189AB4", textColor: "#000", rarity: "Epic" },
  { label: "10 USDC", icon: "S", color: "#1E90FF", darkColor: "#1565C0", textColor: "#fff", rarity: "Common" },
  { label: "5 USDm",  icon: "M", color: "#A855F7", darkColor: "#7C3AED", textColor: "#fff", rarity: "Rare" },
  { label: "100 XP",  icon: "💎", color: "#9C27B0", darkColor: "#6A1B9A", textColor: "#fff", rarity: "Rare" },
  { label: "0.5 CELO",icon: "C", color: "#FF9F1C", darkColor: "#C06000", textColor: "#000", rarity: "Rare" },
] as const;

const TOTAL = SEGMENTS.length;
const SLICE_DEG = 360 / TOTAL;

// ─── SVG Spin Wheel ───────────────────────────────────────────────────────────

function WheelSVG({ rotation, spinning }: { rotation: number; spinning: boolean }) {
  const CX = 160, CY = 160, R = 148;
  const innerR = 28;

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end   = polarToCartesian(cx, cy, r, startAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
  }

  return (
    <svg
      width="300"
      height="300"
      viewBox="0 0 320 320"
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
        filter: "drop-shadow(0 8px 40px rgba(0,0,0,0.7))",
      }}
      aria-hidden
    >
      <defs>
        <radialGradient id="goldRingS" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="60%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#8B6914" />
        </radialGradient>
        <radialGradient id="hubGradS" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={R + 14} fill="none" stroke="rgba(255,215,0,0.18)" strokeWidth="12" />
      <circle cx={CX} cy={CY} r={R + 8} fill="url(#goldRingS)" />
      {[...Array(24)].map((_, i) => {
        const pos = polarToCartesian(CX, CY, R + 8, i * 15);
        return <circle key={i} cx={pos.x} cy={pos.y} r={3.5} fill={i % 2 === 0 ? "#FFD700" : "#FFF8DC"} opacity={0.9} />;
      })}

      {SEGMENTS.map((seg, i) => {
        const start = i * SLICE_DEG;
        const end   = start + SLICE_DEG;
        const mid   = start + SLICE_DEG / 2;
        const labelPos = polarToCartesian(CX, CY, R * 0.62, mid);
        const iconPos  = polarToCartesian(CX, CY, R * 0.38, mid);
        const isEmoji  = seg.icon.length > 1;

        return (
          <g key={seg.label}>
            <path d={describeSlice(CX, CY, R, start, end)} fill={seg.color} />
            <line x1={CX} y1={CY}
              x2={polarToCartesian(CX, CY, R, start).x}
              y2={polarToCartesian(CX, CY, R, start).y}
              stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
            <circle cx={iconPos.x} cy={iconPos.y} r={14} fill={seg.darkColor} opacity={0.7} />
            <text
              x={iconPos.x} y={iconPos.y + (isEmoji ? 5 : 1)}
              textAnchor="middle" dominantBaseline={isEmoji ? undefined : "middle"}
              fontSize="11" fontWeight="900" fontFamily="Space Grotesk, sans-serif"
              fill="white" transform={`rotate(${mid}, ${iconPos.x}, ${iconPos.y})`}
            >{seg.icon}</text>
            <text
              x={labelPos.x} y={labelPos.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="10.5" fontWeight="900" fontFamily="Space Grotesk, sans-serif"
              fill={seg.textColor} transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
            >{seg.label}</text>
          </g>
        );
      })}

      <circle cx={CX} cy={CY} r={innerR + 6} fill="url(#goldRingS)" />
      <circle cx={CX} cy={CY} r={innerR} fill="url(#hubGradS)" />
      <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize="18" fontWeight="900" fontFamily="Space Grotesk, sans-serif" fill="#FFD700">N</text>
    </svg>
  );
}

// ─── Spin Page ────────────────────────────────────────────────────────────────

export default function SpinPage() {
  const queryClient = useQueryClient();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const prevRotation = useRef(0);
  const spinDuration = 4000;

  const { data: spins, isLoading } = useQuery({
    queryKey: ["spins"],
    queryFn: async () => {
      const res = await authFetch("/api/spins");
      if (!res.ok) throw new Error("Failed to fetch spins");
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

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/spins", {
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) throw new Error("Failed to spin");
      return res.json();
    },
    onSuccess: (data) => {
      const rewardLabel = data?.reward ?? data?.prize ?? SEGMENTS[Math.floor(Math.random() * TOTAL)].label;
      const segIdx = SEGMENTS.findIndex((s) => s.label === rewardLabel);
      const targetIdx = segIdx >= 0 ? segIdx : Math.floor(Math.random() * TOTAL);
      const targetAngle = 360 - (targetIdx * SLICE_DEG + SLICE_DEG / 2);
      const newRotation = prevRotation.current + 1800 + targetAngle - (prevRotation.current % 360);
      setRotation(newRotation);
      prevRotation.current = newRotation;
      setTimeout(() => {
        setIsSpinning(false);
        setReward(rewardLabel);
        setShowReward(true);
        queryClient.invalidateQueries({ queryKey: ["spins"] });
        queryClient.invalidateQueries({ queryKey: ["spin-history"] });
      }, spinDuration + 200);
    },
    onError: () => setIsSpinning(false),
  });

  const handleSpin = useCallback(() => {
    if (!isSpinning && (spins?.available ?? 0) > 0) {
      setIsSpinning(true);
      setShowReward(false);
      setReward(null);
      spinMutation.mutate();
    }
  }, [isSpinning, spins?.available, spinMutation]);

  if (isLoading) {
    return (
      <AppShell activeNav="spin">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary animate-spin rounded-full" />
          <p className="text-xs font-black uppercase text-muted-foreground">Loading...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="spin">
      {/* ── Reward popup ── */}
      {showReward && reward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="relative bg-zinc-900 border-4 border-primary rounded-3xl shadow-[0_0_40px_rgba(98,226,248,0.4),6px_6px_0_rgba(0,0,0,1)] p-8 text-center max-w-xs w-full">
            <button
              type="button"
              onClick={() => setShowReward(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" strokeWidth={2.5} />
            </button>
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-xs font-black uppercase tracking-widest mb-1 text-white/60">You won!</p>
            <p className="font-black uppercase italic text-3xl leading-none text-primary mb-5">{reward}</p>
            <button
              type="button"
              onClick={() => setShowReward(false)}
              className="w-full py-3.5 rounded-2xl bg-primary text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all"
            >
              Claim Reward
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* This content renders:                                          */}
      {/*  - On MOBILE: full scrollable column                          */}
      {/*  - On DESKTOP: inside the center column of the 3-grid         */}
      {/* ─────────────────────────────────────────────────────────────── */}

      {/* ── MOBILE header info (hidden on desktop via AppShell) ── */}
      <div>
        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-black uppercase italic">Lucky Drop</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Spin. Win. Celebrate.</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#FBBF24] mt-1">
            Free drops included — try before you commit funds
          </p>
        </div>

        {/* Available drops bar */}
        <div className="flex items-center justify-between bg-zinc-900/80 rounded-2xl p-3 border-2 border-white/10 mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-primary" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-white/50">Your Drops</p>
              <p className="text-base font-black tabular-nums">{spins?.available ?? 0} Available</p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black rounded-xl font-black text-[9px] uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
          >
            GET MORE +
          </button>
        </div>

        {/* Pointer + Wheel */}
        <div className="flex flex-col items-center gap-2 mb-3">
          <div className="relative flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[22px] border-l-transparent border-r-transparent border-b-yellow-400 z-10 mb-[-4px]" />
            <WheelSVG rotation={rotation} spinning={isSpinning} />
          </div>

          {/* Spin button */}
          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning || (spins?.available ?? 0) <= 0}
            className={cn(
              "w-full max-w-[280px] py-3.5 rounded-2xl font-black uppercase text-sm transition-all flex items-center justify-center gap-2 border-4 border-black",
              isSpinning
                ? "bg-zinc-700 text-white/50 cursor-not-allowed shadow-none"
                : (spins?.available ?? 0) > 0
                ? "bg-primary text-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-[#48d0e7]"
                : "bg-zinc-700 text-white/50 opacity-50 cursor-not-allowed shadow-none"
            )}
          >
            {isSpinning ? "Spinning..." : (spins?.available ?? 0) > 0 ? (
              <><Ticket className="w-4 h-4" strokeWidth={2.5} /> SPIN NOW &nbsp;1</>
            ) : "No Drops Available"}
          </button>

          {spins?.nextSpinAt && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              Next free drop:{" "}
              {new Date(spins.nextSpinAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>

        {/* Possible rewards (compact for desktop center column) */}
        <section className="mb-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
            Possible Rewards
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {SEGMENTS.map((seg) => (
              <div
                key={seg.label}
                className="flex items-center gap-1.5 bg-zinc-900/80 rounded-xl p-2 border border-white/10"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                  style={{ background: seg.color, color: seg.textColor }}
                >
                  {seg.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black">{seg.label}</p>
                  <p className="text-[8px] text-muted-foreground">{seg.rarity}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Drop history */}
        {(history?.history?.length ?? 0) > 0 && (
          <section>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Drop History
            </p>
            <div className="bg-zinc-900/80 rounded-xl border border-white/10 divide-y divide-white/5">
              {history.history.slice(0, 5).map((entry: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-2.5 py-2">
                  <div>
                    <p className="text-[10px] font-black">{entry.reward ?? entry.prize ?? "Reward"}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">
                    Won
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
