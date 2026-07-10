import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IBadgeEngine } from "./interfaces";

export class BadgeEngine implements IBadgeEngine {
  name = "BadgeEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getAvailableBadges(userId: string): Promise<Record<string, unknown>[]> {
    const allBadges = await prisma().badge.findMany();
    const identity = await prisma().playerIdentity.findUnique({
      where: { userId },
    });

    return allBadges.map((badge) => ({
      slug: badge.slug,
      name: badge.name,
      tier: badge.tier,
      icon: badge.icon,
      unlocked: true,
      equipped: identity?.selectedBadge === badge.slug,
    }));
  }

  async equipBadge(userId: string, badgeSlug: string): Promise<Record<string, unknown>> {
    const badge = await prisma().badge.findUnique({
      where: { slug: badgeSlug },
    });

    if (!badge) {
      throw new Error("Badge not found");
    }

    const identity = await prisma().playerIdentity.upsert({
      where: { userId },
      update: { selectedBadge: badgeSlug },
      create: {
        userId,
        selectedBadge: badgeSlug,
      },
    });

    eventBus.publish({
      event: "BadgeEquipped",
      userId,
      badgeSlug,
    });

    return { selectedBadge: identity.selectedBadge };
  }
}
