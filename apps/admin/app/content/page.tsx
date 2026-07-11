"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function ContentPage() {
  const [blocks, setBlocks] = useState<Array<Record<string, unknown>>>([]);
  const [locales, setLocales] = useState<string[]>([]);

  useEffect(() => {
    adminFetch<{ blocks: Array<Record<string, unknown>> }>("/api/v1/admin/content").then((r) => setBlocks(r.blocks));
    adminFetch<{ locales: string[] }>("/api/v1/admin/content?locales=1").then((r) => setLocales(r.locales));
  }, []);

  return (
    <AdminShell title="Content Management">
      <p className="text-sm text-muted-foreground mb-4">Locales: {locales.join(", ") || "en"}</p>
      <div className="space-y-3">
        {blocks.map((b) => (
          <div key={String(b.id)} className="admin-card">
            <p className="font-bold">{String(b.title)}</p>
            <p className="text-xs text-muted-foreground">{String(b.placement)} · {String(b.locale ?? "en")}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
