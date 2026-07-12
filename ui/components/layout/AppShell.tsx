"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Sun, Moon } from "lucide-react";
import { NAV_ITEMS } from "@/config/constants";
import { cn } from "@/utils/format";
import { useTheme } from "@/app/providers";
import { useAuth } from "@/lib/auth/useAuth";
import { authFetch } from "@/lib/auth/client";
import { UnlockAnimationToast } from "@/components/social/UnlockAnimationToast";
import type { NavKey } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  activeNav: NavKey;
}

export function AppShell({ children, activeNav }: AppShellProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.wallet) return;
    const ping = (status: string) =>
      authFetch("/api/presence", {
        method: "POST",
        body: JSON.stringify({ status }),
      }).catch(() => {});
    ping("ONLINE");
    const interval = setInterval(() => ping("ONLINE"), 3 * 60 * 1000);
    return () => {
      clearInterval(interval);
      ping("OFFLINE");
    };
  }, [session?.wallet]);

  return (
    <div className={`min-h-screen flex flex-col bg-background ${theme}`}>
      <div
        className="fixed inset-0 pointer-events-none opacity-40 z-0 bg-gradient-to-b from-background via-background/95 to-background"
      />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent-orange)/0.12),transparent_40%),radial-gradient(circle_at_80%_80%,hsl(var(--accent-purple)/0.12),transparent_40%)] pointer-events-none z-0" />

      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border/30 backdrop-blur-md bg-card/60">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
            <span className="text-xs font-black text-white">N</span>
          </div>
          <span className="text-sm font-black uppercase tracking-tight">
            Nex<span className="text-primary">ora</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ConnectButton chainStatus="none" showBalance={false} />
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-lg border border-border/40 bg-card/70"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <UnlockAnimationToast />
      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24">
        {children}
      </main>

      <BottomNav pathname={pathname} activeNav={activeNav} />
    </div>
  );
}

function BottomNav({
  pathname,
  activeNav,
}: {
  pathname: string;
  activeNav: NavKey;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/30 backdrop-blur-md bg-card/80 px-2 py-2 safe-area-pb">
      <ul className="flex justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeNav || pathname === item.href;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center px-2 py-1 text-[10px] font-semibold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
