import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { ITitleEngine } from "./interfaces";

export class TitleEngine implements ITitleEngine {
  name = "TitleEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getAvailableTitles(userId: string): Promise<Record<string, unknown>[]> {
    const allTitles = await prisma().title.findMany();
    const userAchievements = await prisma().userAchievement.findMany({
      where: { userId, unlocked: true },
      include: { achievement: true },
    });

    const unlockedTitleSlugs = new Set(
      userAchievements
        .filter((ua) => ua.achievement.category === "TOURNAMENT" || ua.achievement.category === "SKILL")
        .map((ua) => ua.achievement.title.toLowerCase().replace(/\s+/g, "-"))
    );

    const identity = await prisma().playerIdentity.findUnique({
      where: { userId },
    });

    return allTitles.map((title) => ({
      slug: title.slug,
      name: title.name,
      rarity: title.rarity,
      unlocked: unlockedTitleSlugs.has(title.slug),
      equipped: identity?.selectedTitle === title.slug,
    }));
  }

  async equipTitle(userId: string, titleSlug: string): Promise<Record<string, unknown>> {
    const title = await prisma().title.findUnique({
      where: { slug: titleSlug },
    });

    if (!title) {
      throw new Error("Title not found");
    }

    const identity = await prisma().playerIdentity.upsert({
      where: { userId },
      update: { selectedTitle: titleSlug },
      create: {
        userId,
        selectedTitle: titleSlug,
      },
    });

    eventBus.publish({
      event: "TitleEquipped",
      userId,
      titleSlug,
    });

    return { selectedTitle: identity.selectedTitle };
  }
}
