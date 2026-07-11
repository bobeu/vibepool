import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { AdminAnalyticsEngine } from "@/services/engines/admin/AdminEngines";

const engine = new AdminAnalyticsEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async () => {
    const metrics = await engine.getMetrics();
    return jsonResponse(metrics);
  });
