import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { ModerationEngine } from "@/services/engines/admin/AdminEngines";

const engine = new ModerationEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "moderation:read", async (_wallet, request) => {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const fraud = request.nextUrl.searchParams.get("fraud");
    if (fraud === "1") {
      const signals = await engine.listFraudSignals();
      return jsonResponse({ fraudSignals: signals });
    }
    const reports = await engine.listReports(status);
    return jsonResponse({ reports });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "moderation:write", async (wallet, request) => {
    const body = await request.json();
    if (body.action === "resolve") {
      const result = await engine.resolveReport(body.reportId, body.resolution, wallet, Boolean(body.approve));
      await auditAdminAction(wallet, "resolve_report", "moderation", body.reportId, { resolution: body.resolution });
      return jsonResponse(result);
    }
    const report = await engine.createReport(body);
    return jsonResponse(report, 201);
  });
