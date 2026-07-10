import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IStatisticsEngine } from "./interfaces";

export class StatisticsEngine implements IStatisticsEngine {
  name = "StatisticsEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async increment(userId: string, type: string, value = 1, metadata?: Record<string, unknown>): Promise<void> {
    await prisma().playerStatistic.upsert({
      where: {
        userId_type: {
          userId,
          type: type as any,
        },
      },
      update: {
        value: { increment: value },
        metadata,
      },
      create: {
        userId,
        type: type as any,
        value,
        metadata,
      },
    });
  }

  async getStats(userId: string): Promise<Record<string, unknown>> {
    const stats = await prisma().playerStatistic.findMany({
      where: { userId },
    });

    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    const result: Record<string, unknown> = {
      predictionsSubmitted: 0,
      predictionsWon: 0,
      predictionAccuracy: 0,
      xpEarned: 0,
      pointsEarned: 0,
      rewardsEarned: 0,
      spinsEarned: 0,
      spinsUsed: 0,
      loginDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      missionCompletionPercentage: 0,
      tournamentWins: 0,
      leaderboardFinishes: 0,
    };

    for (const stat of stats) {
      switch (stat.type) {
        case "PREDICTIONS_SUBMITTED":
          result.predictionsSubmitted = stat.value;
          break;
        case "PREDICTIONS_WON":
          result.predictionsWon = stat.value;
          break;
        case "PREDICTION_ACCURACY":
          result.predictionAccuracy = stat.value;
          break;
        case "XP_EARNED":
          result.xpEarned = stat.value;
          break;
        case "POINTS_EARNED":
          result.pointsEarned = stat.value;
          break;
        case "REWARDS_EARNED":
          result.rewardsEarned = stat.value;
          break;
        case "SPINS_EARNED":
          result.spinsEarned = stat.value;
          break;
        case "SPINS_USED":
          result.spinsUsed = stat.value;
          break;
        case "LOGIN_DAYS":
          result.loginDays = stat.value;
          break;
        case "CURRENT_STREAK":
          result.currentStreak = stat.value;
          break;
        case "LONGEST_STREAK":
          result.longestStreak = stat.value;
          break;
        case "MISSION_COMPLETION_PERCENTAGE":
          result.missionCompletionPercentage = stat.value;
          break;
        case "TOURNAMENT_WINS":
          result.tournamentWins = stat.value;
          break;
        case "LEADERBOARD_FINISHES":
          result.leaderboardFinishes = stat.value;
          break;
      }
    }

    if (profile) {
      result.xpEarned = profile.xp;
      result.pointsEarned = profile.points;
      result.spinsEarned = profile.spins;
      result.currentStreak = profile.currentStreak;
      result.longestStreak = profile.longestStreak;
    }

    return result;
  }
}
