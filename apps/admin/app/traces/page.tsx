"use client";

import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function TracesPage() {
  const [traceId, setTraceId] = useState("");
  const [spans, setSpans] = useState<Record<string, unknown>[]>([]);

  async function load() {
    if (!traceId.trim()) return;
    const data = await adminFetch<{ spans: Record<string, unknown>[] }>(`/api/v1/admin/traces?traceId=${encodeURIComponent(traceId.trim())}`);
    setSpans(data.spans ?? []);
  }

  return (
    <AdminShell title="Trace Explorer">
      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm"
          placeholder="Trace ID"
          value={traceId}
          onChange={(e) => setTraceId(e.target.value)}
        />
        <button type="button" onClick={load} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold">
          Load Trace
        </button>
      </div>
      <div className="admin-card space-y-3">
        {spans.length === 0 && <p className="text-sm text-muted-foreground">Enter a trace ID to visualize request flow.</p>}
        {spans.map((s) => (
          <div key={String(s.spanId)} className="border-l-2 border-primary pl-4 py-1">
            <p className="font-medium">{String(s.operation)}</p>
            <p className="text-xs text-muted-foreground">
              {String(s.service)} · {String(s.durationMs)}ms · {String(s.status)}
            </p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
