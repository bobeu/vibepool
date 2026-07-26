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
      const bubbleId = String(body.bubbleId ?? "");
      if (!sessionId || !bubbleId) throw new Error("sessionId and bubbleId required");

      const userId = await resolveUserId(wallet);
      const result = await spinHuntEngine.recordHit({
        userId,
        sessionId,
        bubbleId,
        taps: typeof body.taps === "number" ? body.taps : undefined,
        clientElapsedMs:
          typeof body.clientElapsedMs === "number" ? body.clientElapsedMs : undefined,
      });
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};
