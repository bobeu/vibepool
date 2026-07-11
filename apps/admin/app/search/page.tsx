"use client";

import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

type SearchResult = { type: string; id: string; [key: string]: unknown };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  async function search() {
    const data = await adminFetch<{ results: SearchResult[] }>(`/api/v1/admin/search?q=${encodeURIComponent(query)}`);
    setResults(data.results ?? []);
  }

  return (
    <AdminShell title="Global Search">
      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm"
          placeholder="Search users, seasons, campaigns, audit…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button type="button" onClick={search} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold">
          Search
        </button>
      </div>
      <ul className="admin-card divide-y divide-border">
        {results.map((r) => (
          <li key={`${r.type}-${r.id}`} className="py-3 text-sm">
            <span className="text-xs uppercase text-primary font-bold mr-2">{r.type}</span>
            <span>{JSON.stringify(r)}</span>
          </li>
        ))}
        {results.length === 0 && <li className="py-3 text-muted-foreground">No results yet.</li>}
      </ul>
    </AdminShell>
  );
}
