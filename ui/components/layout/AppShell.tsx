"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Swords,
  RotateCw,
  User,
  Sparkles,
  Trophy,
  Bell,
  CheckSquare,
  Zap,
  Signal,
  Wifi,
  Battery,
  BookOpen,
} from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/config/navigation";
import { WalletConnect } from "@/components/layout/WalletConnect";
import { cn } from "@/utils/format";
import { useUIStore } from "@/store/uiStore";
import { UnlockAnimationToast } from "@/components/social/UnlockAnimationToast";
import { Onboarding } from "@/components/common/Onboarding";
import type { NavKey } from "@/types";

// ─── Icon Maps ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  home:        <Home         className="w-5 h-5" strokeWidth={2.5} />,
  arena:       <Swords       className="w-5 h-5" strokeWidth={2.5} />,
  spin:        <RotateCw     className="w-5 h-5" strokeWidth={2.5} />,
  leaderboard: <Trophy       className="w-5 h-5" strokeWidth={2.5} />,
  profile:     <User         className="w-5 h-5" strokeWidth={2.5} />,
  prediction:  <Sparkles     className="w-5 h-5" strokeWidth={2.5} />,
  missions:    <CheckSquare  className="w-5 h-5" strokeWidth={2.5} />,
  rewards:     <Zap          className="w-5 h-5" strokeWidth={2.5} />,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppShellProps {
  children: React.ReactNode;
  activeNav: NavKey;
  variant?: "mobile" | "tablet" | "auto";
  spinLayout?: boolean;
}

// ─── Main AppShell ────────────────────────────────────────────────────────────

export function AppShell({ children, activeNav, spinLayout = false }: AppShellProps) {
  const pathname = usePathname();
  const { toastMessage, clearToast } = useUIStore();
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("9:41");

  useEffect(() => {
    setMounted(true);
    const done = localStorage.getItem("vibepool_onboarding_done");
    setOnboardingDone(!!done);
  }, []);

  // Live clock for status bar
  useEffect(() => {
    const update = () => {
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setCurrentTime(`${h}:${m} ${ampm}`);
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toastMessage, clearToast]);

  if (!mounted) return null;

  const handleOnboardingComplete = () => {
    localStorage.setItem("vibepool_onboarding_done", "1");
    setOnboardingDone(true);
  };

  // ─── SHARED inner content ─────────────────────────────────────────────────

  const innerContent = (
    <>
      {/* Onboarding overlay */}
      {!onboardingDone && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none w-[calc(100%-2rem)]">
          <div className="px-5 py-3 bg-black text-white text-xs font-black uppercase border-4 border-primary rounded-2xl shadow-[4px_4px_0_hsl(var(--primary))] animate-bounce text-center">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-card/80 backdrop-blur-sm shrink-0 select-none z-30 relative">
        <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform">
          <div className="relative w-8 h-8 overflow-hidden bg-primary border-2 border-black rounded-xl flex-shrink-0 shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
            <Image src="/logo.png" alt="Vibepool" fill className="object-cover" />
          </div>
          <span className="font-black uppercase tracking-tight italic text-sm leading-none">
            Vibe<span className="text-primary">pool</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative p-1.5 border-2 border-white/20 bg-zinc-900/80 rounded-xl flex-shrink-0"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" strokeWidth={2.5} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
          </button>
          <div className="flex-shrink-0 max-w-[140px] overflow-hidden">
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Unlock animation */}
      <UnlockAnimationToast />

      {/* Page content */}
      <main className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-4 py-4 pb-28 relative z-10">
        {children}
      </main>

      {/* Bottom Dock */}
      <BottomDock pathname={pathname} activeNav={activeNav} />
    </>
  );

  return (
    <>
      {/* ── MOBILE: full screen ── */}
      <div className="md:hidden flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30 z-0"
          style={{ backgroundImage: "url('/backgrounddark.png')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.08)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0" />
        <div className="relative z-10 flex flex-col flex-1">
          {innerContent}
        </div>
      </div>

      {/* ── DESKTOP: Centred Simulated Mobile Device Frame ── */}
      <div className="hidden md:flex min-h-screen w-full items-center justify-center bg-background sm:p-6 relative overflow-hidden">

        {/* Desktop background */}
        <div
          className="fixed inset-0 bg-cover bg-center pointer-events-none opacity-20 z-0"
          style={{ backgroundImage: "url('/backgrounddark.png')" }}
        />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_28%_34%,hsl(var(--primary)/0.18),transparent_20%),radial-gradient(circle_at_72%_72%,hsl(var(--accent-purple)/0.12),transparent_20%)] pointer-events-none z-0" />

        {/* Floating desktop label */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
          <div className="relative w-8 h-8 overflow-hidden bg-primary border-2 border-black rounded-xl flex-shrink-0">
            <Image src="/logo.png" alt="Vibepool" fill className="object-cover" />
          </div>
          <span className="font-black uppercase tracking-tight italic text-lg text-white">
            Vibe<span className="text-primary">pool</span>
          </span>
        </div>

        {/* Phone frame */}
        <div className="relative z-10 w-full h-screen sm:h-[840px] sm:w-[410px] sm:rounded-[44px] sm:border-[10px] sm:border-foreground bg-background text-foreground shadow-[0_30px_80px_-10px_hsl(var(--foreground)/0.6)] overflow-hidden flex flex-col transition-all duration-300 sm:ring-1 sm:ring-border">

          {/* Notch + Status Bar */}
          <div className="hidden sm:flex shrink-0 h-10 bg-foreground text-background px-6 items-center justify-between text-[11px] font-bold select-none relative z-50">
            <div>{currentTime}</div>

            {/* Dynamic Speaker / Camera notch */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 h-6 w-32 bg-background rounded-b-2xl flex items-center justify-center">
              <div className="w-10 h-1 bg-foreground/20 rounded-full mb-1.5" />
              <div className="w-2.5 h-2.5 bg-foreground/25 rounded-full absolute right-5 mb-1.5" />
            </div>

            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" strokeWidth={2.5} />
              <Wifi   className="w-3.5 h-3.5" strokeWidth={2.5} />
              <Battery className="w-4 h-4"    strokeWidth={2.5} />
            </div>
          </div>

          {/* Background inside the phone frame */}
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30 z-0"
            style={{ backgroundImage: "url('/backgrounddark.png')" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.08)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0" />

          {/* App content */}
          <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
            {innerContent}
          </div>

          {/* iOS home indicator */}
          <div className="hidden sm:block shrink-0 h-4 bg-foreground relative z-50">
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-background/30 rounded-full" />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Bottom Dock ──────────────────────────────────────────────────────────────

function BottomDock({
  pathname,
  activeNav,
}: {
  pathname: string;
  activeNav: NavKey;
}) {
  return (
    <nav className="absolute bottom-4 left-3 right-3 z-40 shrink-0">
      <div className="bg-zinc-950/95 border-2 border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] backdrop-blur-sm px-2 py-1">
        <ul className="flex justify-around">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive = item.key === activeNav || pathname === item.href;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 group"
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary text-black shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                        : "text-white/50 group-hover:text-white/80 group-hover:bg-white/5"
                    )}
                  >
                    {ICON_MAP[item.icon]}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-black uppercase tracking-wide transition-colors",
                      isActive ? "text-primary" : "text-white/40"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
