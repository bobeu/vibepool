import { NextRequest } from "next/server";
import { optionalAuthHandler, authenticatedHandler } from "@/lib/auth/middleware";
import { TournamentService } from "@/services/TournamentService";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async () => {
    const service = new TournamentService();
    const tournaments = await service.listAll();
    return jsonResponse({ tournaments });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (_wallet, request) => {
    try {
      const body = await request.json();
      const tournament = await new TournamentService().getTournament(body.id as string);
      if (!tournament) {
        return apiError(new Error("Tournament not found"));
      }
      return jsonResponse(tournament);
    } catch (error) {
      return apiError(error);
    }
  });
};
