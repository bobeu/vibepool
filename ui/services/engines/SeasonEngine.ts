import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import { CURRENT_SEASON } from "@/lib/arena/constants";
import type { ISeasonEngine } from "./interfaces";

export class SeasonEngine implements ISeasonEngine {
  name = "SeasonEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getActiveSeason(): Promise<Record<string, unknown>> {
    const active = await prisma().season.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { number: "desc" },
      include: { tiers: { orderBy: { tierLevel: "asc" } }, rewards: true },
    });

    if (active) return this.formatSeason(active);

    const fallback = await prisma().season.findFirst({ orderBy: { number: "desc" } });
    if (fallback) return this.formatSeason(fallback);

    return {
      number: CURRENT_SEASON,
      name: `Season ${CURRENT_SEASON}`,
      status: "ACTIVE",
      fallback: true,
    };
  }

  async getActiveSeasonNumber(): Promise<number> {
    const season = await this.getActiveSeason();
    return (season.number as number) ?? CURRENT_SEASON;
  }

  async listSeasons(): Promise<Record<string, unknown>[]> {
    const seasons = await prisma().season.findMany({ orderBy: { number: "desc" } });
    return seasons.map((s) => this.formatSeason(s));
  }

  async createSeason(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const number = Number(data.number);
    const existing = await prisma().season.findUnique({ where: { number } });
    if (existing) throw new Error("Season number already exists");

    const season = await prisma().season.create({
      data: {
        number,
        name: (data.name as string) ?? `Season ${number}`,
        description: (data.description as string) ?? null,
        status: (data.status as any) ?? "PRESEASON",
        startAt: new Date(data.startAt as string),
        endAt: new Date(data.endAt as string),
        preseasonAt: data.preseasonAt ? new Date(data.preseasonAt as string) : null,
        config: (data.config as object) ?? undefined,
      },
    });

    logger.info("Season created", { id: season.id, number });
    return this.formatSeason(season);
  }

  async activateSeason(seasonId: string): Promise<Record<string, unknown>> {
    await prisma().season.updateMany({ where: { status: "ACTIVE" }, data: { status: "ENDED" } });
    const season = await prisma().season.update({
      where: { id: seasonId },
      data: { status: "ACTIVE" },
    });

    eventBus.publish({
      event: "SeasonStarted",
      aggregateId: season.id,
      aggregateType: "Season",
      seasonNumber: season.number,
      name: season.name,
    });

    return this.formatSeason(season);
  }

  async rollover(): Promise<Record<string, unknown>> {
    const active = await prisma().season.findFirst({ where: { status: "ACTIVE" }, orderBy: { number: "desc" } });
    if (!active) return { rolled: false, reason: "No active season" };

    if (new Date() < active.endAt) return { rolled: false, reason: "Season not ended" };

    await prisma().season.update({ where: { id: active.id }, data: { status: "ENDED" } });

    eventBus.publish({
      event: "SeasonEnded",
      aggregateId: active.id,
      aggregateType: "Season",
      seasonNumber: active.number,
    });

    const next = await prisma().season.findFirst({
      where: { number: active.number + 1, status: "PRESEASON" },
    });

    if (next) {
      await this.activateSeason(next.id);
      return { rolled: true, ended: active.number, activated: next.number };
    }

    return { rolled: true, ended: active.number, activated: null };
  }

  async getProgress(wallet: string): Promise<Record<string, unknown>> {
    const user = await prisma().userProfile.findUnique({ where: { wallet }, select: { id: true } });
    if (!user) throw new Error("User not found");

    const season = await this.getActiveSeason();
    const seasonRecord = await prisma().season.findUnique({ where: { number: season.number as number } });
    if (!seasonRecord) return { seasonXp: 0, tierLevel: 0 };

    const progress = await prisma().seasonProgress.upsert({
      where: { userId_seasonId: { userId: user.id, seasonId: seasonRecord.id } },
      update: {},
      create: { userId: user.id, seasonId: seasonRecord.id },
    });

    return {
      seasonNumber: season.number,
      seasonXp: progress.seasonXp,
      tierLevel: progress.tierLevel,
      seasonRank: progress.seasonRank,
      matchesPlayed: progress.matchesPlayed,
      rewardsClaimed: progress.rewardsClaimed,
    };
  }

  async addSeasonXp(userId: string, amount: number): Promise<void> {
    const seasonRecord = await prisma().season.findFirst({ where: { status: "ACTIVE" } });
    if (!seasonRecord || amount <= 0) return;

    const progress = await prisma().seasonProgress.upsert({
      where: { userId_seasonId: { userId, seasonId: seasonRecord.id } },
      update: { seasonXp: { increment: amount } },
      create: { userId, seasonId: seasonRecord.id, seasonXp: amount },
    });

    const tiers = await prisma().seasonTier.findMany({
      where: { seasonId: seasonRecord.id },
      orderBy: { tierLevel: "desc" },
    });
    const tier = tiers.find((t) => progress.seasonXp >= t.xpRequired);
    if (tier && tier.tierLevel > progress.tierLevel) {
      await prisma().seasonProgress.update({
        where: { userId_seasonId: { userId, seasonId: seasonRecord.id } },
        data: { tierLevel: tier.tierLevel },
      });
    }
  }

  private formatSeason(s: Record<string, unknown>): Record<string, unknown> {
    return {
      id: s.id,
      number: s.number,
      name: s.name,
      description: s.description,
      status: s.status,
      startAt: s.startAt,
      endAt: s.endAt,
      preseasonAt: s.preseasonAt,
      tiers: s.tiers,
      rewards: s.rewards,
    };
  }
}

export const seasonEngine = new SeasonEngine();

export async function getActiveSeasonNumber(): Promise<number> {
  return seasonEngine.getActiveSeasonNumber();
}
