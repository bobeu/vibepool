"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { checkAdminAuth, clearToken } from "@/lib/api";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/observability", label: "Observability" },
  { href: "/alerts", label: "Alerts" },
  { href: "/traces", label: "Traces" },
  { href: "/experiments", label: "Experiments" },
  { href: "/search", label: "Search" },
  { href: "/users", label: "Users" },
  { href: "/moderation", label: "Moderation" },
  { href: "/arena", label: "Arena Ops" },
  { href: "/seasons", label: "Seasons" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/flags", label: "Feature Flags" },
  { href: "/scheduler", label: "Scheduler" },
  { href: "/rewards", label: "Rewards" },
  { href: "/analytics", label: "Analytics" },
  { href: "/audit", label: "Audit" },
  { href: "/content", label: "Content" },
];

export function AdminShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    if (pathname === "/login") return;
    checkAdminAuth().then((r) => {
      if (!r.authorized) router.replace("/login");
      else setRole(r.role ?? null);
    });
  }, [pathname, router]);

  const onSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchQ.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      }
    },
    [router, searchQ]
  );

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-card/50 p-4 flex flex-col gap-1">
        <div className="mb-6 px-2">
          <p className="text-xs uppercase tracking-widest text-primary font-bold">NEXORA</p>
          <h1 className="text-lg font-black">Operations</h1>
          {role && <p className="text-xs text-muted-foreground mt-1">{role}</p>}
        </div>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          className="mt-auto text-left rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            clearToken();
            router.push("/login");
          }}
        >
          Sign out
        </button>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title ?? "Admin Console"}</h2>
          <input
            type="search"
            placeholder="Search… (Enter)"
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm w-64"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={onSearch}
          />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
