import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { musicEngine } from "@/services/engines/MusicEngine";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const userId = await resolveUserId(wallet);
      const catalog = await musicEngine.listCatalog(userId);
      return jsonResponse({ tracks: catalog });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const body = await request.json();
      const userId = await resolveUserId(wallet);
      const action = String(body.action ?? "purchase");
      const trackId = String(body.trackId ?? "");
      if (!trackId) throw new Error("trackId required");

      if (action === "equip") {
        const result = await musicEngine.equip(userId, trackId);
        return jsonResponse(result);
      }

      if (action === "remove") {
        const result = await musicEngine.remove(userId, trackId);
        return jsonResponse(result);
      }

      const result = await musicEngine.purchase({
        wallet,
        userId,
        trackId,
        txHash: body.txHash ? String(body.txHash) : undefined,
      });
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
