import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { UserManagementEngine } from "@/services/engines/admin/AdminEngines";

const engine = new UserManagementEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "users:read", async (_wallet, request) => {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const profile = await engine.getProfile(id);
      return jsonResponse({ profile });
    }
    const users = await engine.search(q);
    return jsonResponse({ users });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "users:write", async (wallet, request) => {
    const body = await request.json();
    const { action, userId, reason, xp, points } = body;

    let result: Record<string, unknown>;
    switch (action) {
      case "suspend":
        result = await engine.suspendUser(userId, reason ?? "No reason");
        break;
      case "unsuspend":
        result = await engine.unsuspendUser(userId);
        break;
      case "shadow_ban":
        result = await engine.shadowBan(userId, reason ?? "No reason");
        break;
      case "reset_season":
        result = await engine.resetSeasonProgress(userId);
        break;
      case "compensate":
        result = await engine.grantCompensation(userId, Number(xp ?? 0), Number(points ?? 0));
        break;
      case "force_logout":
        result = await engine.forceLogout(userId);
        break;
      default:
        throw new Error("Unknown action");
    }

    await auditAdminAction(wallet, action, "users", userId, { reason });
    return jsonResponse(result);
  });
