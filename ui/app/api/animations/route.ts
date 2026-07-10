import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { UnlockAnimationService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const animationService = new UnlockAnimationService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const animations = await animationService.getPending(wallet);
      return jsonResponse({ animations });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      if (!body.animationId) {
        return jsonResponse({ error: "animationId required" }, 400);
      }
      const result = await animationService.markViewed(wallet, body.animationId);
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};
