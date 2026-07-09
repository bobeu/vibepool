import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { TournamentService } from "@/services/TournamentService";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (_wallet) => {
    const tournaments = await new TournamentService().getActive();
    return jsonResponse({ tournaments });
  });
};

export const POST = authenticatedHandler(async (_wallet, req: NextRequest) => {
  try {
    const body = await req.json();
    const tournament = await new TournamentService().getTournament(body.id as string);
    if (!tournament) {
      return apiError(new Error("Tournament not found"));
    }
    return jsonResponse(tournament);
  } catch (error) {
    return apiError(error);
  }
});
