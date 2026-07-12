import { NextRequest } from "next/server";
import { authenticatedHandler, optionalAuthHandler } from "@/lib/auth/middleware";
import { PredictionService } from "@/services/PredictionService";
import { TournamentService } from "@/services/TournamentService";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { predictionSchema } from "@/lib/validation/schemas";

const predictionService = new PredictionService();

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async (wallet) => {
    const tournament = await new TournamentService().getCurrentTournament();
    if (!tournament) {
      return jsonResponse({ tournament: null });
    }

    let userPrediction = null;
    if (wallet) {
      userPrediction = await predictionService.getUserPrediction(wallet, tournament.id as string);
    }

    return jsonResponse({ tournament, userPrediction });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const body = await request.json();
      const parsed = predictionSchema.parse(body);
      const result = await predictionService.submitPrediction(wallet, parsed);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
