"use client";

import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function ExperimentsPage() {
  const [flagKey, setFlagKey] = useState("arena");
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  async function load() {
    const result = await adminFetch(`/api/v1/admin/experiments?flagKey=${encodeURIComponent(flagKey)}`);
    setData(result);
  }

  return (
    <AdminShell title="Experiment Analytics">
      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm"
          value={flagKey}
          onChange={(e) => setFlagKey(e.target.value)}
          placeholder="Feature flag key"
        />
        <button type="button" onClick={load} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold">
          Compare Variants
        </button>
      </div>
      <pre className="admin-card text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </AdminShell>
  );
}
