"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/api";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    adminFetch("/api/v1/admin/analytics").then(setMetrics);
  }, []);

  const chartData = metrics
    ? [
        { name: "DAU", value: metrics.dau as number },
        { name: "WAU", value: metrics.wau as number },
        { name: "MAU", value: metrics.mau as number },
      ]
    : [];

  return (
    <AdminShell title="Analytics Dashboard">
      <div className="admin-card h-72 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(24 100% 54%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <pre className="admin-card text-xs overflow-auto">{JSON.stringify(metrics, null, 2)}</pre>
    </AdminShell>
  );
}
