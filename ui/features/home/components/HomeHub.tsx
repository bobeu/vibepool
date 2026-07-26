"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  Sparkles,
  Swords,
  RotateCw,
  Trophy,
  ChevronRight,
  TrendingUp,
  Star,
  Flame,
  Zap,
  Gift,
  Target,
  Crown,
  ListChecks,
} from "lucide-react";
import { LevelProgress } from "@/components/ui/LevelProgress";
import { authFetch, isFreePlaySession, startFreePlaySession } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";
import { cn } from "@/utils/format";

// ─── Action tiles config ──────────────────────────────────────────────────────

const ACTION_TILES = [
  {
    href: "/prediction",
    label: "Predict",
    sub: "CELO Volatility\nEarn Yield",
    icon: Sparkles,
    image: "/prediction.png",
    bg: "bg-[#FBBF24]",
    textColor: "text-black",
    border: "border-black",
    shadow: "shadow-[4px_4px_0_rgba(0,0,0,1)]",
  },
  {
    href: "/arena",
    label: "Arena",
    sub: "1v1 Duels\nWin Big",
    icon: Swords,
    image: "/arena.png",
    bg: "bg-[#7C3AED]",
    textColor: "text-white",
    border: "border-purple-900",
    shadow: "shadow-[4px_4px_0_rgba(60,0,130,0.8)]",
  },
  {
    href: "/missions",
    label: "Missions",
    sub: "Daily Quests\n+XP Rewards",
    icon: ListChecks,
    image: "/progression_level_up.png",
    bg: "bg-[#E91E8C]",
    textColor: "text-white",
    border: "border-pink-900",
    shadow: "shadow-[4px_4px_0_rgba(130,0,80,0.8)]",
  },
  {
    href: "/spin",
    label: "Spin & Win",
    sub: "Free Daily Drop\nCELO Rewards",
    icon: RotateCw,
    image: "/spin_and_navigation.png",
    bg: "bg-[#62E2F8]",
    textColor: "text-black",
    border: "border-cyan-700",
    shadow: "shadow-[4px_4px_0_rgba(0,120,140,0.8)]",
  },
];

// ─── Quick links below the grid ──────────────────────────────────────────────

const QUICK_LINKS = [
  { href: "/rewards",     label: "Rewards",     icon: Gift,   accent: "text-yellow-400" },
  { href: "/season",      label: "Season",      icon: Flame,  accent: "text-orange-400" },
  { href: "/leaderboard", label: "Leaderboard", icon: Crown,  accent: "text-primary"    },
  { href: "/referrals",   label: "Referrals",   icon: Target, accent: "text-pink-400"   },
];

// ─── HomeHub ──────────────────────────────────────────────────────────────────

export function HomeHub() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { session, isFreePlay, isLoading: authLoading } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await authFetch("/api/profile");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 15_000,
    enabled: Boolean(session),
  });

  const { data: spins } = useQuery({
    queryKey: ["spins"],
    queryFn: async () => {
      const res = await authFetch("/api/spins");
      if (!res.ok) return { available: 0 };
      return res.json();
    },
    staleTime: 15_000,
    enabled: Boolean(session),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await authFetch("/api/leaderboard");
      if (!res.ok) return { leaderboard: [] };
      return res.json();
    },
    staleTime: 30_000,
  });

  const topPlayers: any[] = leaderboard?.leaderboard?.slice(0, 3) ?? [];
  const username =
    profile?.username ??
    (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : isFreePlay ? "Guest Player" : "Player");

  const startPractice = async (href: string) => {
    if (!session) {
      const ok = await startFreePlaySession();
      if (!ok) return;
    }
    router.push(href);
  };

  return (
    <div className="space-y-4">

      {/* ── Free Play banner (MiniPay: try before funds) ── */}
      {(isFreePlay || isFreePlaySession() || (!session && !isConnected && !authLoading)) && (
        <div className="rounded-2xl border-4 border-black bg-[#FBBF24] text-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Practice Mode</p>
            <p className="font-black uppercase italic text-lg leading-tight">
              Try free play — no funds needed
            </p>
            <p className="text-[11px] font-bold text-black/70 mt-1">
              Predict, duel the practice bot, and spin Lucky Drop before connecting your wallet.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => startPractice("/prediction")}
              className="py-2 rounded-xl bg-black text-primary text-[9px] font-black uppercase border-2 border-black"
            >
              Predict
            </button>
            <button
              type="button"
              onClick={() => startPractice("/arena")}
              className="py-2 rounded-xl bg-black text-[#E91E8C] text-[9px] font-black uppercase border-2 border-black"
            >
              Arena
            </button>
            <button
              type="button"
              onClick={() => startPractice("/spin")}
              className="py-2 rounded-xl bg-black text-[#62E2F8] text-[9px] font-black uppercase border-2 border-black"
            >
              Spin
            </button>
          </div>
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950">
        {/* Background hero image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.png"
            alt="Nexora Hero"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>

        <div className="relative z-10 px-4 pt-4 pb-3">
          {/* Top stats pills */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-black/50 border border-yellow-400/30 rounded-lg px-2.5 py-1 backdrop-blur-sm">
              <Star className="w-3 h-3 text-yellow-400" strokeWidth={2.5} />
              <span className="text-[10px] font-black tabular-nums text-white">
                {(profile?.xp ?? 12_450).toLocaleString()} XP
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/50 border border-purple-400/30 rounded-lg px-2.5 py-1 backdrop-blur-sm">
              <Zap className="w-3 h-3 text-purple-400" strokeWidth={2.5} />
              <span className="text-[10px] font-black tabular-nums text-white">
                {(profile?.gems ?? 5_230).toLocaleString()} Gems
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/50 border border-green-400/30 rounded-lg px-2.5 py-1 backdrop-blur-sm">
              <TrendingUp className="w-3 h-3 text-green-400" strokeWidth={2.5} />
              <span className="text-[10px] font-black tabular-nums text-white">
                {profile?.celo ?? 325} CELO
              </span>
            </div>
          </div>

          {/* Welcome text */}
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            Welcome back,
          </p>
          <p className="font-black uppercase italic text-white text-xl leading-tight mb-3">
            {username}!
          </p>

          {/* Level progress */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary border-2 border-black rounded-xl font-black text-black text-sm shadow-[2px_2px_0_rgba(0,0,0,0.6)]">
              {profile?.level ?? 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-black uppercase text-[10px]">Level {profile?.level ?? 1}</p>
                <p className="text-[9px] text-muted-foreground tabular-nums">
                  {(profile?.xp ?? 4_250).toLocaleString()} / 6,000 XP
                </p>
              </div>
              {profile ? (
                <LevelProgress xp={profile.xp ?? 0} level={profile.level ?? 1} />
              ) : (
                <div className="h-2 bg-white/10 rounded-full border border-white/10">
                  <div className="h-full w-[70%] bg-primary rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spin Available nudge */}
        {(spins?.available ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => router.push("/spin")}
            className="relative z-10 w-full flex items-center gap-2.5 px-4 py-2.5 bg-primary/20 border-t-2 border-primary/30 text-left transition-colors hover:bg-primary/30 active:bg-primary/40"
          >
            <RotateCw className="w-4 h-4 text-primary" strokeWidth={2.5} />
            <p className="text-[10px] font-black uppercase text-primary flex-1">
              🎁 {spins.available} Free Drop{spins.available > 1 ? "s" : ""} Ready — Spin Now!
            </p>
            <ChevronRight className="w-4 h-4 text-primary" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Quick Links Row ── */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_LINKS.map((ql) => {
          const Icon = ql.icon;
          return (
            <Link
              key={ql.href}
              href={ql.href}
              className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-white/10 bg-zinc-900/80 py-3 px-1 active:scale-95 transition-all hover:border-white/20 hover:bg-zinc-800/80"
            >
              <Icon className={cn("w-5 h-5", ql.accent)} strokeWidth={2.5} />
              <span className="text-[8px] font-black uppercase text-white/60 text-center leading-tight">
                {ql.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── TODAY Tiles ── */}
      <section>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2.5 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.5} />
          Today&apos;s Arena
        </p>
        <div className="grid grid-cols-2 gap-3">
          {ACTION_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.href} href={tile.href} className="block">
                <div
                  className={cn(
                    "rounded-2xl overflow-hidden border-4 active:scale-95 transition-all flex flex-col",
                    tile.bg,
                    tile.border,
                    tile.shadow
                  )}
                >
                  {/* Image cover */}
                  <div className="relative h-[84px] w-full overflow-hidden">
                    <Image
                      src={tile.image}
                      alt={tile.label}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/15" />
                    {/* Icon badge */}
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-black/50 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className={cn("w-4 h-4", tile.textColor === "text-black" ? "text-white" : "text-white")} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="p-3">
                    <p className={cn("font-black uppercase text-xs leading-none", tile.textColor)}>
                      {tile.label}
                    </p>
                    <p className={cn("text-[9px] font-bold mt-1 whitespace-pre-line leading-tight opacity-75", tile.textColor)}>
                      {tile.sub}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Leaderboard Preview ── */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
            Leaderboard
          </p>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:underline"
          >
            View All <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </Link>
        </div>

        <div className="bg-zinc-900/80 rounded-2xl border-2 border-white/10 divide-y divide-white/5 overflow-hidden">
          {topPlayers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-5 font-semibold">
              No rankings yet — be the first!
            </p>
          )}
          {topPlayers.map((entry: any, idx: number) => (
            <div key={entry.userId ?? idx} className="flex items-center gap-3 px-4 py-3">
              {/* Rank badge */}
              <span
                className={cn(
                  "w-8 h-8 flex items-center justify-center text-xs font-black rounded-xl flex-shrink-0 border-2",
                  idx === 0
                    ? "bg-[#FBBF24] text-black border-black shadow-[2px_2px_0_rgba(0,0,0,1)]"
                    : idx === 1
                    ? "bg-zinc-300 text-black border-zinc-600 shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
                    : "bg-amber-700 text-white border-amber-900"
                )}
              >
                {idx === 0 ? "👑" : idx + 1}
              </span>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 border-2 border-white/10 flex items-center justify-center flex-shrink-0 text-xs font-black text-white">
                {(entry.user?.username ?? "P").charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs truncate">
                  {entry.user?.username ?? "Player"}
                </p>
                <p className="text-[9px] text-muted-foreground">Celo Predictor</p>
              </div>

              {/* XP */}
              <div className="flex items-center gap-1 shrink-0">
                <TrendingUp className="w-3 h-3 text-primary" strokeWidth={2.5} />
                <p className="text-xs font-black tabular-nums text-primary">
                  {(entry.xp ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Big Feature Image Cards ── */}
      <section className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
          Featured
        </p>

        {/* Play, Earn & Complete Banner */}
        <Link href="/prediction" className="block">
          <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 h-36 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <Image src="/play_earn_complete.png" alt="Play Earn Complete" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-0.5">Featured</p>
              <p className="font-black uppercase italic text-white text-lg leading-tight">
                Play, Earn &<br />Complete!
              </p>
            </div>
            <div className="absolute top-3 right-3">
              <span className="bg-primary text-black font-black text-[9px] uppercase px-2.5 py-1 rounded-lg border border-black shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                Live Now
              </span>
            </div>
          </div>
        </Link>

        {/* Referral Banner */}
        <Link href="/referrals" className="block">
          <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 h-32 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <Image src="/referral_design.png" alt="Refer & Earn" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <p className="text-[10px] font-black uppercase text-yellow-400 tracking-widest mb-0.5">Referrals</p>
              <p className="font-black uppercase italic text-white text-base leading-tight">
                Invite Friends<br />& Earn CELO
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  );
}
