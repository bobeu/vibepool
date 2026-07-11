import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { FeatureFlagEngine } from "@/services/engines/FeatureFlagEngine";

const engine = new FeatureFlagEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "flags:read", async (_wallet, request) => {
    const key = request.nextUrl.searchParams.get("key");
    if (key) {
      const preview = await engine.previewImpact(key);
      return jsonResponse({ preview });
    }
    const flags = await engine.listFlags();
    return jsonResponse({ flags });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "flags:write", async (wallet, request) => {
    const body = await request.json();
    const flag = await engine.upsertFlag(body);
    await auditAdminAction(wallet, "upsert_flag", "flags", body.key);
    return jsonResponse(flag);
  });
