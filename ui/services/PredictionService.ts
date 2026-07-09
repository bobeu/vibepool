import { prisma } from "@/lib/auth/session";
import { TournamentService } from "@/services/TournamentService";
import { PredictionEngine } from "@/services/engines/PredictionEngine";
import { logger } from "@/lib/logging";
import type { IPredictionService } from "./interfaces";

export class PredictionService implements IPredictionService {
  name = "PredictionService";
  private predictionEngine = new PredictionEngine();

  async getCurrentRound(_wallet?: string): Promise<Record<string, unknown> | null> {
    const tournament = await new TournamentService().getCurrentTournament();
    return tournament;
  }

  async submitPrediction(wallet: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const tournament = await new TournamentService().getCurrentTournament();

    if (!tournament) {
      throw new Error("No active tournament");
    }

    if (!this.predictionEngine.validatePredictionData(payload)) {
      throw new Error("Invalid prediction data");
    }

    const existing = await prisma().prediction.findFirst({
      where: { tournamentId: tournament.id as string, userId: wallet },
    });

    if (existing) {
      throw new Error("Prediction already submitted for this tournament");
    }

    const prediction = await prisma().prediction.create({
      data: {
        tournamentId: tournament.id as string,
        userId: wallet,
        predictionValue: payload.predictionValue as number,
        submittedValue: payload.predictionValue as number,
        status: "PENDING",
        submittedAt: new Date(),
      },
    });

    await prisma().tournament.update({
      where: { id: tournament.id as string },
      data: { currentPlayers: { increment: 1 } },
    });

    await prisma().activity.create({
      data: {
        userId: wallet,
        type: "PREDICTION",
        metadata: { tournamentId: tournament.id, predictionId: prediction.id },
      },
    });

    logger.info("Prediction submitted", { tournamentId: tournament.id, wallet });
    return {
      id: prediction.id,
      tournamentId: prediction.tournamentId,
      status: prediction.status,
      submittedAt: prediction.submittedAt,
    };
  }

  async evaluatePrediction(predictionId: string, actualValue: number): Promise<Record<string, unknown>> {
    const prediction = await prisma().prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      throw new Error("Prediction not found");
    }

    const accuracy = this.predictionEngine.calculateAccuracy(prediction.predictionValue, actualValue);

    await prisma().prediction.update({
      where: { id: predictionId },
      data: {
        actualValue,
        accuracy,
        status: "EVALUATED",
        submittedValue: prediction.predictionValue,
      },
    });

    logger.info("Prediction evaluated", { predictionId, accuracy });
    return {
      id: prediction.id,
      accuracy,
      status: "EVALUATED",
    };
  }
}
