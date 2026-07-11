"use client";

import { useEffect, useState } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function ObservabilityPage() {
  const [system, setSystem] = useState<Record<string, unknown> | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch("/api/v1/admin/system"),
      adminFetch("/api/v1/admin/health"),
    ]).then(([sys, h]) => {
      setSystem(sys);
      setHealth(h);
    }).catch(() => {});
  }, []);

  const product = (system?.dashboard as Record<string, unknown>)?.product as Record<string, unknown> | undefined;
  const chartData = product
    ? [
        { name: "DAU", value: product.dau as number },
        { name: "WAU", value: product.wau as number },
        { name: "MAU", value: product.mau as number },
      ]
    : [];

  const components = (health?.components as Array<Record<string, unknown>>) ?? [];

  return (
    <AdminShell title="Observability">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="admin-card">
          <p className="text-xs text-muted-foreground">Platform Status</p>
          <p className="text-2xl font-bold capitalize">{(health?.status as string) ?? "—"}</p>
        </div>
        <div className="admin-card">
          <p className="text-xs text-muted-foreground">Open Alerts</p>
          <p className="text-2xl font-bold">{(system?.dashboard as Record<string, unknown>)?.openAlerts as number ?? 0}</p>
        </div>
        <div className="admin-card">
          <p className="text-xs text-muted-foreground">API P95 (ms)</p>
          <p className="text-2xl font-bold">{(health?.apiP95Ms as number) ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="admin-card h-64">
          <h3 className="text-sm font-bold mb-2">Active Users</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(24 100% 54%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="admin-card h-64">
          <h3 className="text-sm font-bold mb-2">Service Health</h3>
          <ul className="space-y-2 text-sm">
            {components.map((c) => (
              <li key={String(c.component)} className="flex justify-between">
                <span>{String(c.component)}</span>
                <span className="capitalize">{String(c.status)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-bold mb-2">Dependency Graph</h3>
        <pre className="text-xs overflow-auto">{JSON.stringify((system?.dashboard as Record<string, unknown>)?.dependencies, null, 2)}</pre>
      </div>
    </AdminShell>
  );
}
