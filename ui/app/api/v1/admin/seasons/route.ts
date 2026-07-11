import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { SeasonEngine } from "@/services/engines/SeasonEngine";

const engine = new SeasonEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "seasons:read", async () => {
    const [active, seasons] = await Promise.all([engine.getActiveSeason(), engine.listSeasons()]);
    return jsonResponse({ active, seasons });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "seasons:write", async (wallet, request) => {
    const body = await request.json();
    let result: Record<string, unknown>;
    if (body.action === "activate") {
      result = await engine.activateSeason(body.seasonId);
    } else if (body.action === "rollover") {
      result = await engine.rollover();
    } else {
      result = await engine.createSeason(body);
    }
    await auditAdminAction(wallet, body.action ?? "create", "seasons", body.seasonId);
    return jsonResponse(result);
  });
