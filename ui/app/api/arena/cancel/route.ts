import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ArenaService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const arenaService = new ArenaService();

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      if (body.matchId && body.decline) {
        return jsonResponse(await arenaService.declineMatch(wallet, body.matchId));
      }
      const result = await arenaService.cancelQueue(wallet);
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};
