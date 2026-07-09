import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { RewardService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const rewards = await RewardService.getClaimable(wallet);
    return jsonResponse({ rewards });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = body.type === "points"
        ? await RewardService.claimPoints(wallet)
        : { claimed: false };
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
