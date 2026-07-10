import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IGamificationEngine } from "./interfaces";

export class GamificationEngine implements IGamificationEngine {
  name = "GamificationEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getLevelProgress(userId: string): Promise<Record<string, unknown>> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return { level: 0, xp: 0, nextLevelXp: 1000, progress: 0 };
    }

    const currentLevel = profile.level || 0;
    const currentXp = profile.xp || 0;
    const nextLevelXp = (currentLevel + 1) * 1000;
    const progress = Math.min((currentXp / nextLevelXp) * 100, 100);

    return {
      level: currentLevel,
      xp: currentXp,
      nextLevelXp,
      progress,
    };
  }

  async getPlayerRank(userId: string): Promise<Record<string, unknown>> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
      include: {
        leaderboardSnapshots: {
          orderBy: { rank: "asc" },
          take: 1,
        },
      },
    });

    if (!profile) {
      return { rank: null, bestRank: null, totalPlayers: 0 };
    }

    const totalPlayers = await prisma().userProfile.count();

    return {
      currentRank: profile.currentRank || null,
      bestRank: profile.leaderboardSnapshots[0]?.rank || null,
      totalPlayers,
      percentile: totalPlayers > 0 ? Math.round(((totalPlayers - (profile.currentRank || totalPlayers)) / totalPlayers) * 100) : 0,
    };
  }

  async getEngagementMetrics(userId: string): Promise<Record<string, unknown>> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return {};
    }

    const activities = await prisma().activity.count({
      where: { userId },
    });

    const predictions = await prisma().prediction.count({
      where: { userId },
    });

    const missions = await prisma().userMission.count({
      where: { userId, completed: true },
    });

    const spins = await prisma().spinLedger.count({
      where: { userId },
    });

    return {
      totalActivity: profile.totalActivity || activities,
      totalPredictions: predictions,
      completedMissions: missions,
      totalSpins: spins,
      currentStreak: profile.currentStreak || 0,
      longestStreak: profile.longestStreak || 0,
      daysSinceLastLogin: profile.lastLogin ? Math.floor((Date.now() - new Date(profile.lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : null,
    };
  }
}
