import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { spinHuntEngine } from "@/services/engines/SpinHuntEngine";

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const body = await request.json();
      const sessionId = String(body.sessionId ?? "");
      if (!sessionId) throw new Error("sessionId required");

      const userId = await resolveUserId(wallet);
      const result = await spinHuntEngine.finishSession({
        wallet,
        userId,
        sessionId,
      });
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};
