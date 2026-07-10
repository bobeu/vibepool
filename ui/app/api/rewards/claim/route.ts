import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { RewardClaimEngine } from "@/services/engines/RewardClaimEngine";
import { jsonResponse, apiError } from "@/lib/api/responses";

const rewardClaimEngine = new RewardClaimEngine();

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await rewardClaimEngine.claimReward(wallet, body.rewardId as string);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
