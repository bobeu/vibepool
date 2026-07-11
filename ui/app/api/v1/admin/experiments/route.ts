import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { ExperimentAnalyticsEngine } from "@/services/engines/observability/ObservabilityEngines";

const engine = new ExperimentAnalyticsEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async (_wallet, request) => {
    const flagKey = request.nextUrl.searchParams.get("flagKey");
    if (!flagKey) return jsonResponse({ error: "flagKey required" }, 400);
    const comparison = await engine.compare(flagKey);
    return jsonResponse(comparison);
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async (_wallet, request) => {
    const body = await request.json();
    await engine.record(String(body.flagKey), String(body.variant), String(body.metricName), Number(body.value), Number(body.sampleSize ?? 1));
    return jsonResponse({ recorded: true });
  });
