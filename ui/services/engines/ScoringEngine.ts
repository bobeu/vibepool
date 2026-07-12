import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IScoringEngine } from "./interfaces";

async function getSettings(): Promise<Record<string, string>> {
  const all = await prisma().settings.findMany();
  return Object.fromEntries(all.map((s) => [s.key, s.value]));
}

function getSetting(settings: Record<string, string>, key: string, fallback: string): string {
  return settings[key] ?? fallback;
}

export class ScoringEngine implements IScoringEngine {
  name = "ScoringEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async calculateScores(
    predictions: Record<string, unknown>[],
    settings: Record<string, string>
  ): Promise<Record<string, unknown>[]> {
    const results: Record<string, unknown>[] = [];
    const totalParticipants = predictions.length;

    for (const prediction of predictions) {
      const accuracy = (prediction.accuracy as number) ?? 0;
      const isCorrect = accuracy >= 0.9;
      const rank = (prediction.rank as number) ?? totalParticipants;

      const accuracyScore = Number((accuracy * 100).toFixed(2));
      const consistencyScore = this.calculateConsistencyScore(prediction, settings);
      const participationScore = Number(getSetting(settings, "score_participation", "10"));
      const dailyBonus = Number(getSetting(settings, "score_daily_bonus", "5"));

      const totalScore = Number(
        (
          accuracyScore +
          consistencyScore +
          participationScore +
          dailyBonus
        ).toFixed(2)
      );

      results.push({
        ...prediction,
        accuracyScore,
        consistencyScore,
        participationScore,
        dailyBonus,
        totalScore,
      });
    }

    return results;
  }

  private calculateConsistencyScore(
    prediction: Record<string, unknown>,
    settings: Record<string, string>
  ): number {
    const streak = ((prediction.user?.currentRank ?? 0) as number) || 0;
    const bonus = Number(getSetting(settings, "score_consistency_bonus", "10"));
    return Math.min(streak * bonus, 100);
  }
}
