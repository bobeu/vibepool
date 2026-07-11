"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function AlertsPage() {
  const [data, setData] = useState<{ rules: Record<string, unknown>[]; incidents: Record<string, unknown>[] } | null>(null);

  useEffect(() => {
    adminFetch("/api/v1/admin/alerts").then(setData).catch(() => {});
  }, []);

  async function evaluate() {
    await adminFetch("/api/v1/admin/alerts", { method: "POST", body: JSON.stringify({ action: "evaluate" }) });
    const fresh = await adminFetch("/api/v1/admin/alerts");
    setData(fresh);
  }

  return (
    <AdminShell title="Alert Center">
      <div className="flex justify-between mb-4">
        <p className="text-sm text-muted-foreground">{data?.incidents?.length ?? 0} incidents</p>
        <button type="button" onClick={evaluate} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold">
          Evaluate Rules
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card">
          <h3 className="font-bold mb-3">Open Incidents</h3>
          <ul className="space-y-2 text-sm">
            {(data?.incidents ?? []).map((i) => (
              <li key={String(i.id)} className="border-b border-border pb-2">
                <p className="font-medium">{String(i.message)}</p>
                <p className="text-muted-foreground">{String(i.severity)} · {String(i.status)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="admin-card">
          <h3 className="font-bold mb-3">Rules</h3>
          <ul className="space-y-2 text-sm">
            {(data?.rules ?? []).map((r) => (
              <li key={String(r.id)} className="flex justify-between">
                <span>{String(r.name)}</span>
                <span>{String(r.metricName)} {String(r.condition)} {String(r.threshold)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
