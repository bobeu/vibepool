"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function RewardsPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    adminFetch("/api/v1/admin/rewards").then(setData);
  }, []);

  return (
    <AdminShell title="Reward Operations">
      <pre className="admin-card text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </AdminShell>
  );
}
