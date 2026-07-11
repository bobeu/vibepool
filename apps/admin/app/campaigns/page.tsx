"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    adminFetch<{ campaigns: Array<Record<string, unknown>> }>("/api/v1/admin/campaigns").then((r) => setCampaigns(r.campaigns));
  }, []);

  return (
    <AdminShell title="Campaign Manager">
      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={String(c.id)} className="admin-card flex justify-between items-center">
            <div>
              <p className="font-bold">{String(c.name)}</p>
              <p className="text-xs text-muted-foreground">{String(c.type)} · v{String(c.version)}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{String(c.status)}</span>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
