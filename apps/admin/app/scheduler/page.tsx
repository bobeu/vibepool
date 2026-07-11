"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function SchedulerPage() {
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    adminFetch<{ jobs: Array<Record<string, unknown>> }>("/api/v1/admin/scheduler").then((r) => setJobs(r.jobs));
  }, []);

  async function runDue() {
    await adminFetch("/api/v1/admin/scheduler", { method: "POST", body: JSON.stringify({ action: "run_due" }) });
    const r = await adminFetch<{ jobs: Array<Record<string, unknown>> }>("/api/v1/admin/scheduler");
    setJobs(r.jobs);
  }

  return (
    <AdminShell title="Scheduler Console">
      <button type="button" onClick={runDue} className="mb-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold">Run Due Jobs</button>
      <div className="space-y-2">
        {jobs.map((j) => (
          <div key={String(j.id)} className="admin-card text-sm flex justify-between">
            <span>{String(j.jobType)}</span>
            <span className="text-muted-foreground">{String(j.status)}{j.dryRun ? " (dry)" : ""}</span>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
