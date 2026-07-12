"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Swords,
  RefreshCw,
  Gift,
  User,
  Sparkles,
  Trophy,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MOBILE_NAV_ITEMS, TABLET_NAV_ITEMS } from "@/config/navigation";
import { MobileOnly, TabletFrame, TabletOnly } from "@/components/layout/TabletFrame";
import { cn } from "@/utils/format";
import { useTheme } from "@/app/providers";
import { UnlockAnimationToast } from "@/components/social/UnlockAnimationToast";
import type { NavKey } from "@/types";

const MOBILE_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="w-5 h-5" strokeWidth={2.5} />,
  arena: <Swords className="w-5 h-5" strokeWidth={2.5} />,
  spin: <RefreshCw className="w-5 h-5" strokeWidth={2.5} />,
  rewards: <Gift className="w-5 h-5" strokeWidth={2.5} />,
  profile: <User className="w-5 h-5" strokeWidth={2.5} />,
};

const TABLET_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="w-5 h-5" strokeWidth={2.5} />,
  predict: <Sparkles className="w-5 h-5" strokeWidth={2.5} />,
  rounds: <Trophy className="w-5 h-5" strokeWidth={2.5} />,
  admin: <User className="w-5 h-5" strokeWidth={2.5} />,
};

interface AppShellProps {
  children: React.ReactNode;
  activeNav: NavKey;
  variant?: "mobile" | "tablet" | "auto";
}

export function AppShell({ children, activeNav, variant = "auto" }: AppShellProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const shell = (
    <>
      <AppHeader theme={theme} setTheme={setTheme} compact={variant === "tablet"} />
      <UnlockAnimationToast />
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 md:pb-28">
        {children}
      </main>
      <BottomNav pathname={pathname} activeNav={activeNav} mode={variant === "tablet" ? "tablet" : "mobile"} />
    </>
  );

  if (variant === "mobile") {
    return <MobileOnly>{shell}</MobileOnly>;
  }

  if (variant === "tablet") {
    return (
      <TabletFrame>
        <TabletOnly>{shell}</TabletOnly>
      </TabletFrame>
    );
  }

  return (
    <>
      <MobileOnly>{shell}</MobileOnly>
      <TabletFrame>
        <TabletOnly>{shell}</TabletOnly>
      </TabletFrame>
    </>
  );
}

function AppHeader({
  theme,
  setTheme,
  compact,
}: {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  compact?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b-[3px] border-black bg-card safe-area-pt">
      <Link href="/" className="flex items-center gap-2">
        <div className="relative w-9 h-9 border-[3px] border-black bg-primary overflow-hidden">
          <Image src="/logo.png" alt="NEXORA" fill className="object-cover" />
        </div>
        <span className="text-base font-black uppercase tracking-tight italic">
          Nex<span className="text-primary">ora</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {!compact && (
          <button
            type="button"
            className="relative p-2 border-[3px] border-black bg-white shadow-[3px_3px_0_#000]"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border border-black" />
          </button>
        )}
        <ConnectButton chainStatus="none" showBalance={false} />
        <button
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 border-[3px] border-black bg-secondary shadow-[3px_3px_0_#000]"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}

function BottomNav({
  pathname,
  activeNav,
  mode,
}: {
  pathname: string;
  activeNav: NavKey;
  mode: "mobile" | "tablet";
}) {
  const items = mode === "tablet" ? TABLET_NAV_ITEMS : MOBILE_NAV_ITEMS;
  const icons = mode === "tablet" ? TABLET_ICONS : MOBILE_ICONS;

  return (
    <nav className="fixed md:absolute bottom-0 left-0 right-0 z-20 border-t-[3px] border-black bg-card px-2 py-2 safe-area-pb">
      <ul className="flex justify-around max-w-lg mx-auto md:max-w-none">
        {items.map((item) => {
          const isActive = item.key === activeNav || pathname === item.href;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-black uppercase transition-colors",
                  isActive ? "text-black" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "p-1.5 border-[2px] border-black",
                    isActive ? "bg-primary shadow-[2px_2px_0_#000]" : "bg-white"
                  )}
                >
                  {icons[item.icon]}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
