"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function FlagsPage() {
  const [flags, setFlags] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    adminFetch<{ flags: Array<Record<string, unknown>> }>("/api/v1/admin/feature-flags").then((r) => setFlags(r.flags));
  }, []);

  return (
    <AdminShell title="Feature Flag Console">
      <div className="space-y-2">
        {flags.map((f) => (
          <div key={String(f.key)} className="admin-card flex justify-between text-sm">
            <span className="font-mono">{String(f.key)}</span>
            <span>{String(f.enabled)} · {String(f.targetType)}</span>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
