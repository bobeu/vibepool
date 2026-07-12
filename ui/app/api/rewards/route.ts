import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { RewardService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const rewardService = new RewardService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const rewards = await rewardService.getClaimable(wallet);
    return jsonResponse({ rewards });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const body = await request.json();
      const result = body.type === "points"
        ? await rewardService.claimPoints(wallet)
        : { claimed: false };
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
