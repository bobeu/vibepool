import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { AlertEngine } from "@/services/engines/AlertEngine";

const engine = new AlertEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async (_wallet, request) => {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const [rules, incidents] = await Promise.all([engine.listRules(), engine.listIncidents(status)]);
    return jsonResponse({ rules, incidents });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async (wallet, request) => {
    const body = await request.json();
    if (body.action === "acknowledge") {
      const incident = await engine.acknowledge(String(body.incidentId), wallet);
      return jsonResponse({ incident });
    }
    if (body.action === "evaluate") {
      const created = await engine.evaluateRules();
      return jsonResponse({ created });
    }
    const rule = await engine.upsertRule(body);
    return jsonResponse({ rule });
  });
