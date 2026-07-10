import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IIdentityEngine } from "./interfaces";

export class IdentityEngine implements IIdentityEngine {
  name = "IdentityEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getIdentity(userId: string): Promise<Record<string, unknown>> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return {};
    }

    const identity = await prisma().playerIdentity.findUnique({
      where: { userId },
    });

    const titles = await prisma().title.findMany();
    const badges = await prisma().badge.findMany();
    const frames = await prisma().avatarFrame.findMany();

    return {
      wallet: profile.wallet,
      username: profile.username,
      avatar: identity?.displayName ?? profile.username,
      selectedTitle: identity?.selectedTitle,
      selectedBadge: identity?.selectedBadge,
      selectedFrame: identity?.selectedFrame,
      theme: identity?.theme,
      availableTitles: titles.map((t) => ({ slug: t.slug, name: t.name, rarity: t.rarity })),
      availableBadges: badges.map((b) => ({ slug: b.slug, name: b.name, tier: b.tier, icon: b.icon })),
      availableFrames: frames.map((f) => ({ slug: f.slug, name: f.name, rarity: f.rarity, cssClass: f.cssClass })),
    };
  }

  async updateIdentity(userId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const identity = await prisma().playerIdentity.upsert({
      where: { userId },
      update: {
        displayName: (data.displayName as string) || undefined,
        selectedTitle: (data.selectedTitle as string) || undefined,
        selectedBadge: (data.selectedBadge as string) || undefined,
        selectedFrame: (data.selectedFrame as string) || undefined,
        theme: (data.theme as string) || undefined,
      },
      create: {
        userId,
        displayName: (data.displayName as string) || null,
        selectedTitle: (data.selectedTitle as string) || null,
        selectedBadge: (data.selectedBadge as string) || null,
        selectedFrame: (data.selectedFrame as string) || null,
        theme: (data.theme as string) || null,
      },
    });

    return {
      displayName: identity.displayName,
      selectedTitle: identity.selectedTitle,
      selectedBadge: identity.selectedBadge,
      selectedFrame: identity.selectedFrame,
      theme: identity.theme,
    };
  }
}
