import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { AdminDashboardEngine } from "@/services/engines/admin/AdminEngines";

const engine = new AdminDashboardEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async () => {
    const dashboard = await engine.getBetaDashboard();
    return jsonResponse(dashboard);
  });
