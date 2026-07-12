import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { SettlementEngine } from "@/services/engines/SettlementEngine";
import { resolveUserId } from "@/lib/auth/resolveUser";

const settlementEngine = new SettlementEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const userId = await resolveUserId(wallet);
      const status = await settlementEngine.getSettlementStatus(userId);
      return jsonResponse(status);
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      if (body.action === "retry" && body.rewardId) {
        const result = await settlementEngine.retryFailed(body.rewardId as string);
        return jsonResponse(result);
      }
      return jsonResponse({ error: "Unsupported action" }, 400);
    } catch (error) {
      return apiError(error);
    }
  });
};
