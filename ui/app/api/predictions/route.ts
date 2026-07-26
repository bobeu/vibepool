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
      const { toPredictionValue } = await import("@/lib/prediction/normalize");
      const tournament = await new TournamentService().getCurrentTournament();
      const startPrice = Number((tournament as { startPrice?: number } | null)?.startPrice ?? 0.07);
      const predictionValue = toPredictionValue(parsed.predictionValue ?? 0, {
        higher: parsed.higher,
        startPrice,
      });
      if (predictionValue <= 0) {
        throw new Error("Invalid prediction value");
      }
      const result = await predictionService.submitPrediction(wallet, {
        tournamentId: parsed.tournamentId ?? tournament?.id,
        predictionValue,
        higher: parsed.higher,
      });
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
