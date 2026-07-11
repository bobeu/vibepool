"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

type Dashboard = {
  players: { total: number; active24h: number; online: number };
  arena: { queueSize: number; activeMatches: number };
  liveOps: { liveEvents: number; activeCampaigns: number; enabledFlags: number; activeSeason: { name: string; number: number } | null };
  scheduler: { pending: number; deadLetter: number; healthy: boolean };
  rewards: { pending: number };
  moderation: { fraudAlerts: number };
  system: { errors24h: number; status: string };
};

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="admin-card">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<Dashboard>("/api/v1/admin/dashboard")
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <AdminShell title="Operations Dashboard">
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {!data && !error && <p className="text-muted-foreground">Loading dashboard…</p>}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Players" value={data.players.total} href="/users" />
          <StatCard label="Active (24h)" value={data.players.active24h} href="/analytics" />
          <StatCard label="Online" value={data.players.online} />
          <StatCard label="Arena Queue" value={data.arena.queueSize} href="/arena" />
          <StatCard label="Active Matches" value={data.arena.activeMatches} href="/arena" />
          <StatCard label="Live Events" value={data.liveOps.liveEvents} href="/seasons" />
          <StatCard label="Active Campaigns" value={data.liveOps.activeCampaigns} href="/campaigns" />
          <StatCard label="Feature Flags On" value={data.liveOps.enabledFlags} href="/flags" />
          <StatCard label="Pending Jobs" value={data.scheduler.pending} href="/scheduler" />
          <StatCard label="Dead Letter Jobs" value={data.scheduler.deadLetter} href="/scheduler" />
          <StatCard label="Pending Rewards" value={data.rewards.pending} href="/rewards" />
          <StatCard label="Fraud Alerts" value={data.moderation.fraudAlerts} href="/moderation" />
          <StatCard label="System Status" value={data.system.status} />
          <StatCard label="Errors (24h)" value={data.system.errors24h} href="/audit" />
        </div>
      )}
      {data?.liveOps.activeSeason && (
        <div className="admin-card mt-6">
          <p className="text-xs text-muted-foreground uppercase">Current Season</p>
          <p className="font-bold mt-1">
            Season {data.liveOps.activeSeason.number}: {data.liveOps.activeSeason.name}
          </p>
        </div>
      )}
    </AdminShell>
  );
}
