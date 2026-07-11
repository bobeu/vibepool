import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { ObservabilityEngine } from "@/services/engines/ObservabilityEngine";

const engine = new ObservabilityEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async () => {
    const health = await engine.checkHealth();
    return jsonResponse(health);
  });
