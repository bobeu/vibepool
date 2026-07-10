import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import { ActivityEngine } from "./ActivityEngine";
import type { IStreakEngine } from "./interfaces";

export class StreakEngine implements IStreakEngine {
  name = "StreakEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async updateStreak(userId: string): Promise<{ current: number; longest: number }> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return { current: 0, longest: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = profile.lastLogin ? new Date(profile.lastLogin) : null;
    const lastLoginDay = lastLogin ? new Date(lastLogin) : null;
    if (lastLoginDay) {
      lastLoginDay.setHours(0, 0, 0, 0);
    }

    let currentStreak = profile.currentStreak || 0;
    let longestStreak = profile.longestStreak || 0;

    const daysSinceLastLogin = lastLoginDay
      ? Math.floor((today.getTime() - lastLoginDay.getTime()) / (1000 * 60 * 60 * 24))
      : -1;

    if (daysSinceLastLogin === 0) {
      return { current: currentStreak, longest: longestStreak };
    }

    if (daysSinceLastLogin === 1) {
      currentStreak += 1;
    } else if (daysSinceLastLogin > 1) {
      currentStreak = 1;
    } else {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    await prisma().userProfile.update({
      where: { id: userId },
      data: {
        currentStreak,
        longestStreak,
        lastLogin: new Date(),
      },
    });

    if (currentStreak > 1 && currentStreak % 5 === 0) {
      eventBus.publish({
        event: "StreakUpdated",
        userId,
        currentStreak,
        longestStreak,
      });
    }

    return { current: currentStreak, longest: longestStreak };
  }

  async getStreak(userId: string): Promise<{ current: number; longest: number }> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return { current: 0, longest: 0 };
    }

    return {
      current: profile.currentStreak || 0,
      longest: profile.longestStreak || 0,
    };
  }
}
