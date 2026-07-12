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

  const shell = (tablet: boolean) => (
    <>
      <AppHeader theme={theme} setTheme={setTheme} tablet={tablet} />
      <UnlockAnimationToast />
      <main
        className={cn(
          "flex-1 overflow-y-auto no-scrollbar min-h-0",
          tablet ? "px-5 py-4 pb-[4.5rem]" : "px-4 py-4 pb-24"
        )}
      >
        {children}
      </main>
      <BottomNav pathname={pathname} activeNav={activeNav} mode={tablet ? "tablet" : "mobile"} />
    </>
  );

  if (variant === "mobile") {
    return <MobileOnly>{shell(false)}</MobileOnly>;
  }

  if (variant === "tablet") {
    return (
      <TabletFrame>
        <TabletOnly>{shell(true)}</TabletOnly>
      </TabletFrame>
    );
  }

  return (
    <>
      <MobileOnly>{shell(false)}</MobileOnly>
      <TabletFrame>
        <TabletOnly>{shell(true)}</TabletOnly>
      </TabletFrame>
    </>
  );
}

function AppHeader({
  theme,
  setTheme,
  tablet,
}: {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  tablet?: boolean;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between shrink-0 bg-card safe-area-pt",
        tablet
          ? "px-5 py-3.5 border-b border-black/10"
          : "px-4 py-3 border-b-[3px] border-black"
      )}
    >
      <Link href="/" className="flex items-center gap-2.5">
        <div
          className={cn(
            "relative overflow-hidden bg-primary",
            tablet ? "w-10 h-10 rounded-xl border border-black/10" : "w-9 h-9 border-[3px] border-black"
          )}
        >
          <Image src="/logo.png" alt="NEXORA" fill className="object-cover" />
        </div>
        <span
          className={cn(
            "font-black uppercase tracking-tight italic",
            tablet ? "text-lg" : "text-base"
          )}
        >
          Nex<span className="text-primary">ora</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {!tablet && (
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
          className={cn(
            "p-2",
            tablet
              ? "rounded-xl border border-black/10 bg-secondary/80"
              : "border-[3px] border-black bg-secondary shadow-[3px_3px_0_#000]"
          )}
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
    <nav
      className={cn(
        "absolute bottom-0 left-0 right-0 z-20 bg-card safe-area-pb",
        mode === "tablet"
          ? "px-4 py-2.5 border-t border-black/10 rounded-t-2xl"
          : "fixed border-t-[3px] border-black px-2 py-2"
      )}
    >
      <ul className={cn("flex justify-around mx-auto", mode === "tablet" ? "max-w-md gap-1" : "max-w-lg")}>
        {items.map((item) => {
          const isActive = item.key === activeNav || pathname === item.href;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 font-black uppercase transition-colors",
                  mode === "tablet" ? "text-[11px]" : "text-[10px]",
                  isActive ? "text-black" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "p-2 transition-colors",
                    mode === "tablet"
                      ? cn("rounded-xl", isActive ? "bg-primary/90 text-black" : "bg-muted/60")
                      : cn(
                          "border-[2px] border-black",
                          isActive ? "bg-primary shadow-[2px_2px_0_#000]" : "bg-white"
                        )
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
