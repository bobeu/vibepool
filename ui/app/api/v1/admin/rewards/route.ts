import { NextRequest } from "next/server";
import { prisma } from "@/lib/auth/session";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { SettlementEngine } from "@/services/engines/SettlementEngine";

const settlementEngine = new SettlementEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "rewards:read", async () => {
    const [pending, failed] = await Promise.all([
      prisma().pendingReward.count({ where: { status: "PENDING" } }),
      prisma().pendingReward.findMany({ where: { status: "FAILED" }, take: 50, orderBy: { updatedAt: "desc" } }),
    ]);
    return jsonResponse({ pending, failed });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "rewards:execute", async (wallet, request) => {
    const body = await request.json();
    let result: Record<string, unknown>;
    if (body.action === "retry") {
      result = await settlementEngine.settleReward(body.rewardId);
    } else if (body.action === "process_batch") {
      result = { processed: await settlementEngine.processPendingRewards(body.limit ?? 10) };
    } else {
      throw new Error("Unknown action");
    }
    await auditAdminAction(wallet, body.action, "rewards", body.rewardId);
    return jsonResponse(result);
  });
