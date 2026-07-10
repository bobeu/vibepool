import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ReferralService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const referralService = new ReferralService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const [referrals, rewards] = await Promise.all([
        referralService.getReferrals(wallet),
        referralService.getRewards(wallet),
      ]);
      return jsonResponse({ ...referrals, rewards });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      if (body.rewardId) {
        const result = await referralService.claimReward(wallet, body.rewardId);
        return jsonResponse(result);
      }
      if (body.referredWallet) {
        const result = await referralService.recordMilestone(body.referredWallet, body.milestone ?? "REGISTERED");
        return jsonResponse({ recorded: true, milestones: result }, 201);
      }
      return jsonResponse({ error: "Invalid request" }, 400);
    } catch (error) {
      return apiError(error);
    }
  });
};
