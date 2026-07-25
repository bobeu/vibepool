"use client";

// These are retained as lightweight utility wrappers for progressive enhancement
// if needed by any remaining components. The main layout is now in AppShell.tsx.

export function MobileOnly({ children }: { children: React.ReactNode }) {
  return <div className="md:hidden flex flex-col min-h-screen">{children}</div>;
}

export function TabletOnly({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:flex flex-col flex-1 min-h-0 h-full w-full">{children}</div>;
}

// These are kept as no-ops / pass-throughs to avoid breaking any lingering imports.
export function LandscapeTabletFrame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TabletDevice({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TabletStatusBar() {
  return null;
}
