import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { ArenaOpsEngine } from "@/services/engines/admin/AdminEngines";

const engine = new ArenaOpsEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "arena:read", async () => {
    const ops = await engine.getOperations();
    return jsonResponse(ops);
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "arena:execute", async (wallet, request) => {
    const body = await request.json();
    let result: Record<string, unknown>;
    if (body.action === "cancel_queue") {
      result = await engine.cancelQueue(body.queueId);
    } else if (body.action === "force_end") {
      result = await engine.forceEndMatch(body.matchId);
    } else {
      throw new Error("Unknown action");
    }
    await auditAdminAction(wallet, body.action, "arena", body.queueId ?? body.matchId);
    return jsonResponse(result);
  });
