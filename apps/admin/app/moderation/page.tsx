"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function ModerationPage() {
  const [reports, setReports] = useState<Array<Record<string, unknown>>>([]);
  const [fraud, setFraud] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    adminFetch<{ reports: Array<Record<string, unknown>> }>("/api/v1/admin/moderation").then((r) => setReports(r.reports));
    adminFetch<{ fraudSignals: Array<Record<string, unknown>> }>("/api/v1/admin/moderation?fraud=1").then((r) => setFraud(r.fraudSignals));
  }, []);

  return (
    <AdminShell title="Moderation">
      <section className="space-y-3 mb-8">
        <h3 className="font-bold">Pending Reports</h3>
        {reports.length === 0 ? <p className="text-sm text-muted-foreground">No pending reports.</p> : reports.map((r) => (
          <div key={String(r.id)} className="admin-card text-sm">
            <p className="font-bold">{String(r.type)}</p>
            <p className="text-muted-foreground">{String(r.reason)}</p>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <h3 className="font-bold">Referral Fraud Review</h3>
        {fraud.map((f) => (
          <div key={String(f.id)} className="admin-card text-sm">
            <p>Referral {String(f.id)} · score {String(f.fraudScore)}</p>
          </div>
        ))}
      </section>
    </AdminShell>
  );
}
