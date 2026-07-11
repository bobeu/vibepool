"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function ArenaOpsPage() {
  const [ops, setOps] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    adminFetch("/api/v1/admin/arena").then(setOps);
  }, []);

  return (
    <AdminShell title="Arena Operations">
      {!ops ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="admin-card">
            <h3 className="font-bold mb-2">Active Queues</h3>
            <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(ops.queues, null, 2)}</pre>
          </div>
          <div className="admin-card">
            <h3 className="font-bold mb-2">Active Matches</h3>
            <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(ops.matches, null, 2)}</pre>
          </div>
          <div className="admin-card lg:col-span-2">
            <h3 className="font-bold mb-2">Queue Simulator Benchmark</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(ops.queueSimulation, null, 2)}</pre>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
