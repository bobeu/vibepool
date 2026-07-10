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
      include: {
        rules: true,
        ruleGroups: { include: { rules: true } },
      },
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

  private async evaluateRule(
    userId: string,
    achievement: {
      id: string;
      rules: { statType: string; operator: string; targetValue: number; windowDays: number }[];
      ruleGroups?: { logic: "AND" | "OR"; rules: { statType: string; operator: string; targetValue: number; windowDays: number }[] }[];
    }
  ): Promise<{ current: number; target: number } | null> {
    const baseRules = achievement.rules || [];
    const groups = achievement.ruleGroups || [];

    if (baseRules.length === 0 && groups.length === 0) {
      return null;
    }

    const sets = [
      ...(baseRules.length > 0 ? [await this.evalRuleSet(userId, baseRules, "AND")] : []),
      ...(await Promise.all(groups.map((group) => this.evalRuleSet(userId, group.rules, group.logic)))),
    ].filter((set) => set.target > 0);

    if (sets.length === 0) {
      return null;
    }

    const passed = sets.every((set) => set.passed);

    if (baseRules.length === 0 && groups.length > 0) {
      return { current: passed ? 1 : 0, target: 1 };
    }

    const progress = passed
      ? Math.max(...sets.map((set) => set.progress))
      : Math.min(...sets.map((set) => set.progress));
    const target = Math.max(...sets.map((set) => set.target));

    return { current: progress, target };
  }

  private compareStat(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case "GT":
        return value > target;
      case "GTE":
        return value >= target;
      case "EQ":
        return value === target;
      case "LTE":
        return value <= target;
      case "LT":
        return value < target;
      default:
        return value >= target;
    }
  }

  private async evalRuleSet(
    userId: string,
    rules: { statType: string; operator: string; targetValue: number; windowDays: number }[],
    logic: "AND" | "OR"
  ): Promise<{ progress: number; target: number; passed: boolean }> {
    if (rules.length === 0) {
      return { progress: 0, target: 0, passed: true };
    }

    const results = await Promise.all(
      rules.map(async (rule) => {
        const stats = await prisma().playerStatistic.findUnique({
          where: {
            userId_type: {
              userId,
              type: rule.statType as any,
            },
          },
        });
        const value = stats?.value ?? 0;
        const met = this.compareStat(value, rule.operator, rule.targetValue);
        return { value, target: rule.targetValue, met };
      })
    );

    if (logic === "OR") {
      const passed = results.some((result) => result.met);
      const best = results.reduce((a, b) => (a.value / a.target > b.value / b.target ? a : b));
      return {
        progress: passed ? best.value : best.value,
        target: best.target,
        passed,
      };
    }

    const passed = results.every((result) => result.met);
    const progress = Math.min(...results.map((result) => result.value));
    const target = Math.max(...results.map((result) => result.target));
    return { progress, target, passed };
  }

  private async evalRules(
    userId: string,
    rules: { statType: string; operator: string; targetValue: number; windowDays: number }[]
  ): Promise<{ current: number; target: number }> {
    const set = await this.evalRuleSet(userId, rules, "AND");
    return { current: set.progress, target: set.target };
  }
}
