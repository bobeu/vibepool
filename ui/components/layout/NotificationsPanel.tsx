"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Gift, Megaphone, Sparkles, Target, X } from "lucide-react";
import { AppOverlay } from "@/components/layout/AppOverlay";
import { authFetch } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";
import { isSpinPayAsset } from "@/lib/spin/economy";
import { formatUnits } from "viem";
import { assetDecimals } from "@/lib/tokens/celoAssets";
import { cn } from "@/utils/format";

type ApiNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  priority?: string;
  createdAt?: string;
};

type FeedItem = {
  id: string;
  title: string;
  body: string;
  kind: "reward" | "system" | "mission" | "info";
  href?: string;
  apiId?: string;
};

function formatPending(amountWei: string, asset: string) {
  try {
    if (!isSpinPayAsset(asset)) return `${amountWei} ${asset}`;
    const n = Number(formatUnits(BigInt(amountWei || "0"), assetDecimals(asset)));
    if (!Number.isFinite(n) || n <= 0) return null;
    return `${n < 0.0001 ? n.toExponential(2) : n.toPrecision(4)} ${asset}`;
  } catch {
    return null;
  }
}

type NotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await authFetch("/api/notifications");
      if (!res.ok) return { notifications: [] as ApiNotification[] };
      return res.json();
    },
    enabled: open && Boolean(session),
    staleTime: 10_000,
  });

  const { data: walletSummary } = useQuery({
    queryKey: ["spin-wallet"],
    queryFn: async () => {
      const res = await authFetch("/api/spin/wallet");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: open && Boolean(session),
    staleTime: 5_000,
  });

  const { data: missionsData } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const res = await authFetch("/api/missions");
      if (!res.ok) return { missions: [] };
      return res.json();
    },
    enabled: open && Boolean(session),
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch("/api/notifications", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Could not mark notification read");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const feed = useMemo(() => {
    const items: FeedItem[] = [];

    const byAsset = (walletSummary?.byAsset ?? {}) as Record<
      string,
      { amountWei: string; canWithdraw: boolean }
    >;
    for (const [asset, summary] of Object.entries(byAsset)) {
      const label = formatPending(summary.amountWei, asset);
      if (!label) continue;
      items.push({
        id: `pending-${asset}`,
        kind: "reward",
        title: summary.canWithdraw ? "Pending winnings ready" : "Pending winnings syncing",
        body: summary.canWithdraw
          ? `${label} can be withdrawn from Spin Hunt.`
          : `${label} is queued. Check Spin Hunt shortly.`,
        href: "/spin",
      });
    }

    const apiItems = (notificationsData?.notifications ?? []) as ApiNotification[];
    for (const n of apiItems) {
      items.push({
        id: `api-${n.id}`,
        apiId: n.id,
        kind: n.type === "REWARD" ? "reward" : n.type === "ALERT" ? "system" : "info",
        title: n.title,
        body: n.body,
      });
    }

    const missions = (missionsData?.missions ?? missionsData?.items ?? []) as Array<{
      id?: string;
      title?: string;
      completed?: boolean;
      claimed?: boolean;
      claimable?: boolean;
    }>;
    const openMission = missions.find((m) => !m.completed && !m.claimed);
    const claimableMission = missions.find((m) => m.claimable || (m.completed && !m.claimed));
    if (claimableMission) {
      items.push({
        id: `mission-claim-${claimableMission.id ?? "x"}`,
        kind: "mission",
        title: "Mission reward ready",
        body: `${claimableMission.title ?? "A mission"} can be claimed now.`,
        href: "/missions",
      });
    } else if (openMission) {
      items.push({
        id: `mission-open-${openMission.id ?? "x"}`,
        kind: "mission",
        title: "New mission available",
        body: `Continue “${openMission.title ?? "Daily quest"}” for XP and rewards.`,
        href: "/missions",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "protocol-welcome",
        kind: "system",
        title: "Nexora updates",
        body: "Spin Hunt, Arena, and Predict stay live. Watch here for pending winnings, missions, and protocol notes.",
      });
    }

    return items;
  }, [missionsData, notificationsData, walletSummary]);

  if (!open) return null;

  const iconFor = (kind: FeedItem["kind"]) => {
    if (kind === "reward") return Gift;
    if (kind === "mission") return Target;
    if (kind === "system") return Megaphone;
    return Sparkles;
  };

  return (
    <AppOverlay>
      <div className="absolute inset-0 z-[90] flex justify-end bg-black/60 backdrop-blur-sm">
        <div className="flex h-full w-full max-w-sm flex-col border-l-4 border-black bg-zinc-950 shadow-[-6px_0_0_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" strokeWidth={2.5} />
              <p className="text-sm font-black uppercase italic">Notifications</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-white/15 bg-zinc-900 p-2"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {isLoading ? (
              <p className="py-8 text-center text-xs font-bold text-white/50">Loading…</p>
            ) : (
              feed.map((item) => {
                const Icon = iconFor(item.kind);
                const content = (
                  <div
                    className={cn(
                      "rounded-2xl border-2 border-white/10 bg-zinc-900/90 p-3 transition-colors",
                      item.href && "hover:border-primary/40"
                    )}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                      <p className="text-[11px] font-black uppercase tracking-wide text-white">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-[11px] font-bold leading-relaxed text-white/65">{item.body}</p>
                  </div>
                );

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => {
                        if (item.apiId) markRead.mutate(item.apiId);
                        onClose();
                      }}
                      className="block"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="block w-full text-left"
                    onClick={() => {
                      if (item.apiId) markRead.mutate(item.apiId);
                    }}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppOverlay>
  );
}
