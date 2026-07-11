"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function AuditPage() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    adminFetch<{ logs: Array<Record<string, unknown>> }>("/api/v1/admin/audit").then((r) => setLogs(r.logs));
  }, []);

  return (
    <AdminShell title="Audit Center">
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-2">Time</th>
              <th className="pb-2">Actor</th>
              <th className="pb-2">Action</th>
              <th className="pb-2">Resource</th>
              <th className="pb-2">Correlation</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={String(l.id)} className="border-b border-border/40">
                <td className="py-2">{String(l.createdAt)}</td>
                <td className="py-2 font-mono">{String(l.actor ?? "—")}</td>
                <td className="py-2">{String(l.action)}</td>
                <td className="py-2">{String(l.entity ?? "—")}</td>
                <td className="py-2 font-mono">{String(l.correlationId ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
