import { NextRequest } from "next/server";
import { authenticatedHandler, optionalAuthHandler } from "@/lib/auth/middleware";
import { PredictionService } from "@/services/PredictionService";
import { TournamentService } from "@/services/TournamentService";
import { LeaderboardService } from "@/services/LeaderboardService";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { predictionSchema, walletSchema } from "@/lib/validation/schemas";

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async (wallet) => {
    const tournament = await new TournamentService().getCurrentTournament();
    if (!tournament) {
      return jsonResponse({ tournament: null });
    }

    let userPrediction = null;
    if (wallet) {
      const predictions = await PredictionService.getCurrentRound(wallet);
      userPrediction = predictions;
    }

    return jsonResponse({ tournament, userPrediction });
  });
};

export const POST = authenticatedHandler(async (wallet, req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = predictionSchema.parse(body);
    const result = await new PredictionService().submitPrediction(wallet, parsed);
    return jsonResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
});
