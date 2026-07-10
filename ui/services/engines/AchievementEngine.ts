import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IAchievementEngine } from "./interfaces";

export class AchievementEngine implements IAchievementEngine {
  name = "AchievementEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async evaluateAchievements(userId: string): Promise<Record<string, unknown>[]> {
    const achievements = await prisma().achievement.findMany({
      where: { active: true },
    });

    const results: Record<string, unknown>[] = [];
    for (const achievement of achievements) {
      const progress = await this.evaluateRule(userId, achievement);
      if (!progress) continue;

      const userAchievement = await prisma().userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        update: {
          progress: progress.current,
          target: progress.target,
          unlocked: progress.current >= progress.target,
          unlockedAt: progress.current >= progress.target ? new Date() : undefined,
        },
        create: {
          userId,
          achievementId: achievement.id,
          progress: progress.current,
          target: progress.target,
          unlocked: progress.current >= progress.target,
          unlockedAt: progress.current >= progress.target ? new Date() : undefined,
        },
      });

      if (userAchievement.unlocked && !userAchievement.notified) {
        eventBus.publish({
          event: "AchievementUnlocked",
          userId,
          achievementId: achievement.id,
          title: achievement.title,
          category: achievement.category,
        });

        await prisma().userAchievement.update({
          where: { id: userAchievement.id },
          data: { notified: true },
        });
      }

      results.push({
        id: achievement.id,
        slug: achievement.slug,
        title: achievement.title,
        progress: userAchievement.progress,
        target: userAchievement.target,
        unlocked: userAchievement.unlocked,
        unlockedAt: userAchievement.unlockedAt,
      });
    }

    return results;
  }

  async getAchievements(userId: string): Promise<Record<string, unknown>[]> {
    const userAchievements = await prisma().userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { createdAt: "desc" },
    });

    return userAchievements.map((ua) => ({
      id: ua.id,
      achievementId: ua.achievementId,
      title: ua.achievement.title,
      description: ua.achievement.description,
      category: ua.achievement.category,
      rarity: ua.achievement.rarity,
      progress: ua.progress,
      target: ua.target,
      unlocked: ua.unlocked,
      unlockedAt: ua.unlockedAt,
    }));
  }

  async getAchievementProgress(userId: string, achievementId: string): Promise<Record<string, unknown>> {
    const userAchievement = await prisma().userAchievement.findFirst({
      where: { userId, achievementId },
      include: { achievement: true },
    });

    if (!userAchievement) {
      return { progress: 0, target: 1, unlocked: false };
    }

    return {
      id: userAchievement.id,
      progress: userAchievement.progress,
      target: userAchievement.target,
      unlocked: userAchievement.unlocked,
      unlockedAt: userAchievement.unlockedAt,
      achievement: userAchievement.achievement,
    };
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<Record<string, unknown>> {
    const achievement = await prisma().achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      throw new Error("Achievement not found");
    }

    const userAchievement = await prisma().userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      update: {
        unlocked: true,
        unlockedAt: new Date(),
        notified: true,
      },
      create: {
        userId,
        achievementId,
        progress: achievement.xpReward,
        target: 1,
        unlocked: true,
        unlockedAt: new Date(),
        notified: true,
      },
    });

    eventBus.publish({
      event: "AchievementUnlocked",
      userId,
      achievementId: achievement.id,
      title: achievement.title,
      category: achievement.category,
    });

    return {
      id: userAchievement.id,
      unlocked: true,
      unlockedAt: userAchievement.unlockedAt,
    };
  }

  private async evaluateRule(userId: string, achievement: { id: string; rules: { statType: string; operator: string; targetValue: number; windowDays: number }[] }): Promise<{ current: number; target: number } | null> {
    const rules = (achievement as any).rules || [];
    if (rules.length === 0) {
      return null;
    }

    let current = 0;
    let target = 0;

    for (const rule of rules) {
      const stats = await prisma().playerStatistic.findUnique({
        where: {
          userId_type: {
            userId,
            type: rule.statType as any,
          },
        },
      });

      const value = stats?.value || 0;
      current += value;
      target += rule.targetValue;
    }

    return { current, target };
  }
}
