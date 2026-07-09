import { prisma } from "@/lib/auth/session";
import type { IPredictionEngine } from "./interfaces";

export class PredictionEngine implements IPredictionEngine {
  name = "PredictionEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async evaluatePredictions(
    tournamentId: string,
    actualValue: number
  ): Promise<Record<string, unknown>[]> {
    const predictions = await prisma().prediction.findMany({
      where: { tournamentId, status: "PENDING" },
      include: { user: true },
    });

    return predictions.map((p) => ({
      id: p.id,
      userId: p.userId,
      predictionValue: p.predictionValue,
      submittedAt: p.submittedAt,
      accuracy: this.calculateAccuracy(p.predictionValue, actualValue),
    }));
  }

  calculateAccuracy(predictionValue: number, actualValue: number): number {
    const diff = Math.abs(predictionValue - actualValue);
    const maxDiff = Math.max(Math.abs(predictionValue), Math.abs(actualValue), 1);
    const accuracy = Math.max(0, 1 - diff / maxDiff);
    return Number(accuracy.toFixed(4));
  }

  validatePredictionData(prediction: Record<string, unknown>): boolean {
    return (
      typeof prediction.predictionValue === "number" &&
      prediction.predictionValue > 0
    );
  }
}
