import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ArenaService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const arenaService = new ArenaService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const matchId = req.nextUrl.searchParams.get("id");
      if (!matchId) throw new Error("matchId required");
      const match = await arenaService.getMatch(wallet, matchId);
      return jsonResponse(match);
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await arenaService.submitPrediction(wallet, body.matchId, Number(body.prediction));
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};
