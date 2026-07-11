import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { ObservabilityEngine } from "@/services/engines/ObservabilityEngine";
import { TelemetryEngine } from "@/services/engines/TelemetryEngine";

const observability = new ObservabilityEngine();
const telemetry = new TelemetryEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async (_wallet, request) => {
    const traceId = request.nextUrl.searchParams.get("traceId");
    if (traceId) {
      const spans = await observability.getTrace(traceId);
      return jsonResponse({ traceId, spans });
    }
    const events = await telemetry.list({ limit: 100 });
    return jsonResponse({ events });
  });
