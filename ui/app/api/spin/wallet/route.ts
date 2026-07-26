import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { spinHuntEngine } from "@/services/engines/SpinHuntEngine";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const userId = await resolveUserId(wallet);
      const summary = await spinHuntEngine.getClaimableSummary(wallet, userId);
      return jsonResponse(summary);
    } catch (error) {
      return apiError(error);
    }
  });
};
