import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ArenaService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const arenaService = new ArenaService();

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await arenaService.joinQueue(
        wallet,
        body.mode ?? "QUICK_MATCH",
        body.matchType ?? "PREDICTION_DUEL",
        { friendWallet: body.friendWallet, inviteCode: body.inviteCode }
      );
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const status = await arenaService.getQueueStatus(wallet);
      return jsonResponse(status);
    } catch (error) {
      return apiError(error);
    }
  });
};
