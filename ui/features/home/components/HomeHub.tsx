"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Shield, Target, Trophy } from "lucide-react";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { LevelProgress } from "@/components/ui/LevelProgress";

export function HomeHub() {
  const router = useRouter();

  const { data: tournaments } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const res = await fetch("/api/tournaments");
      if (!res.ok) throw new Error("Failed to fetch tournaments");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 15_000,
  });

  const { data: missions } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const res = await fetch("/api/missions");
      if (!res.ok) return { missions: [] };
      return res.json();
    },
    staleTime: 15_000,
  });

  const { data: spins } = useQuery({
    queryKey: ["spins"],
    queryFn: async () => {
      const res = await fetch("/api/spins");
      if (!res.ok) return { available: 0 };
      return res.json();
    },
    staleTime: 15_000,
  });

  const { data: rewards } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const res = await fetch("/api/rewards");
      if (!res.ok) return { claimable: 0 };
      return res.json();
    },
    staleTime: 15_000,
  });

  const current = tournaments?.tournaments?.find((t: { status: string }) => t.status === "OPEN");
  const activeMissions = missions?.missions?.filter((m: { completed: boolean }) => !m.completed)?.length ?? 0;
  const claimable = rewards?.pending?.length ?? rewards?.claimable ?? 0;

  return (
    <div className="space-y-5">
      {/* Grand Arena hero — mobile_view layout, skillerdesign theme */}
      <BrutalCard className="overflow-hidden p-0">
        <div className="relative h-40 w-full border-b-[3px] border-black">
          <Image
            src="/NEXORA_Brand_Hero.png"
            alt="Grand Arena"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="brutal-heading text-white text-lg drop-shadow-[2px_2px_0_#000]">
              Grand Arena
            </p>
          </div>
        </div>
        <div className="p-4 space-y-3 bg-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground">Prize Pool</p>
              <p className="text-2xl font-black tabular-nums">
                {(current?.prizePool ?? 22500).toLocaleString()}
              </p>
            </div>
            {current?.endTime && (
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Starts in</p>
                <p className="text-sm font-black">
                  <CountdownTimer endTime={current.endTime} />
                </p>
              </div>
            )}
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push(current ? "/tournament" : "/arena")}
          >
            Join Tournament
          </Button>
        </div>
      </BrutalCard>

      {/* Your Progress */}
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Your Progress
        </h2>
        <BrutalCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-black bg-secondary font-black text-lg shadow-[3px_3px_0_#000]">
              {profile?.level ?? 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black uppercase text-sm">Level {profile?.level ?? 1}</p>
              {profile ? (
                <LevelProgress xp={profile.xp} level={profile.level} />
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Connect wallet to track XP</p>
              )}
            </div>
          </div>
        </BrutalCard>
      </section>

      {/* Quick action tiles — 3 across */}
      <section className="grid grid-cols-3 gap-2">
        <Link href="/missions" className="block">
          <BrutalCard className="p-3 text-center h-full hover:translate-x-[1px] hover:translate-y-[1px] transition-transform">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center border-[2px] border-black bg-secondary shadow-[2px_2px_0_#000]">
              <Shield className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black uppercase">Missions</p>
            <p className="text-xs font-bold mt-0.5">{activeMissions} Active</p>
          </BrutalCard>
        </Link>

        <Link href="/spin" className="block">
          <BrutalCard className="p-3 text-center h-full hover:translate-x-[1px] hover:translate-y-[1px] transition-transform">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center border-[2px] border-black bg-primary shadow-[2px_2px_0_#000]">
              <Target className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black uppercase">Spins</p>
            <p className="text-xs font-bold mt-0.5">{spins?.available ?? 0} Available</p>
          </BrutalCard>
        </Link>

        <Link href="/rewards" className="block">
          <BrutalCard className="p-3 text-center h-full hover:translate-x-[1px] hover:translate-y-[1px] transition-transform">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center border-[2px] border-black bg-accent shadow-[2px_2px_0_#000]">
              <Trophy className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black uppercase">Rewards</p>
            <p className="text-xs font-bold mt-0.5">{claimable} Claimable</p>
          </BrutalCard>
        </Link>
      </section>

      {/* Secondary links */}
      <section className="grid grid-cols-2 gap-2">
        {[
          { href: "/leaderboard", label: "Leaderboard" },
          { href: "/referrals", label: "Referrals" },
          { href: "/friends", label: "Friends" },
          { href: "/community", label: "Community" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <BrutalCard className="p-3 text-center text-xs font-black uppercase hover:bg-muted/50">
              {link.label}
            </BrutalCard>
          </Link>
        ))}
      </section>
    </div>
  );
}
