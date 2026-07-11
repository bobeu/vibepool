"use client";

import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);

  async function search() {
    const res = await adminFetch<{ users: Array<Record<string, unknown>> }>(`/api/v1/admin/users?q=${encodeURIComponent(q)}`);
    setUsers(res.users);
  }

  return (
    <AdminShell title="User Management">
      <div className="flex gap-2 mb-4">
        <input className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search wallet or username" />
        <button type="button" onClick={search} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold">Search</button>
      </div>
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-2">Wallet</th>
              <th className="pb-2">Username</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Level</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={String(u.id)} className="border-b border-border/50">
                <td className="py-2 font-mono text-xs">{String(u.wallet)}</td>
                <td className="py-2">{String(u.username ?? "—")}</td>
                <td className="py-2">{String(u.status)}</td>
                <td className="py-2">{String(u.level)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
