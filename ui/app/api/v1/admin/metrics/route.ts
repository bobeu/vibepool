import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { MetricsEngine } from "@/services/engines/MetricsEngine";
import { AnalyticsEngine } from "@/services/engines/AnalyticsEngine";

const metrics = new MetricsEngine();
const analytics = new AnalyticsEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async (_wallet, request) => {
    const params = request.nextUrl.searchParams;
    const name = params.get("name");
    const hours = Number(params.get("hours") ?? 24);

    if (name) {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const series = await metrics.query(name, since);
      const p50 = await metrics.percentile(name, since, 50);
      const p95 = await metrics.percentile(name, since, 95);
      const p99 = await metrics.percentile(name, since, 99);
      return jsonResponse({ name, series, latency: { p50, p95, p99 } });
    }

    const product = await analytics.collectProductMetrics();
    return jsonResponse({ catalog: metrics.getCatalog(), product });
  });
