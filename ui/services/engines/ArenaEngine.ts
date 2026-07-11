import { prisma } from "@/lib/auth/session";
import { DEFAULT_RATING, leagueForRating } from "@/lib/arena/constants";
import { eventBus } from "./EventBus";
import { getActiveSeasonNumber } from "./SeasonEngine";
import type { IArenaEngine } from "./interfaces";

export class ArenaEngine implements IArenaEngine {
  name = "ArenaEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  private async resolveId(wallet: string): Promise<string | null> {
    const user = await prisma().userProfile.findUnique({ where: { wallet }, select: { id: true } });
    return user?.id ?? null;
  }

  async getHome(wallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const seasonNumber = await getActiveSeasonNumber();
    const [rating, seasonStats, recentMatches, friendsOnline, activeArena] = await Promise.all([
      this.getRating(wallet),
      prisma().arenaSeasonStatistic.findUnique({
        where: { userId_seasonNumber: { userId, seasonNumber } },
      }),
      this.getHistory(wallet, 5),
      this.getFriendsInArena(wallet),
      prisma().arenaPresence.findUnique({ where: { userId } }),
    ]);

    return {
      name: "NEXORA Arena",
      season: seasonNumber,
      rating,
      seasonStats: seasonStats ?? { wins: 0, losses: 0, draws: 0, totalMatches: 0 },
      recentMatches,
      friendsOnline,
      arenaPresence: activeArena?.status ?? "OFFLINE",
    };
  }

  async getRating(wallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const seasonNumber = await getActiveSeasonNumber();
    const rating = await prisma().arenaRating.upsert({
      where: { userId_seasonNumber: { userId, seasonNumber } },
      update: {},
      create: {
        userId,
        seasonNumber,
        skillRating: DEFAULT_RATING,
        league: leagueForRating(DEFAULT_RATING),
      },
    });

    return {
      skillRating: rating.skillRating,
      ratingDeviation: rating.ratingDeviation,
      winRate: rating.winRate,
      matchesPlayed: rating.matchesPlayed,
      currentStreak: rating.currentStreak,
      bestStreak: rating.bestStreak,
      league: rating.league,
      season: seasonNumber,
    };
  }

  async getHistory(wallet: string, limit = 20): Promise<Record<string, unknown>[]> {
    const userId = await this.resolveId(wallet);
    if (!userId) return [];

    const participations = await prisma().matchParticipant.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        match: {
          include: {
            participants: { include: { user: { select: { wallet: true, username: true } } } },
            result: true,
          },
        },
      },
    });

    return participations.map((p) => ({
      matchId: p.matchId,
      status: p.match.status,
      matchType: p.match.matchType,
      mode: p.match.mode,
      outcome: p.outcome,
      score: p.score,
      ratingBefore: p.ratingBefore,
      ratingAfter: p.ratingAfter,
      finishedAt: p.match.finishedAt,
      opponent: p.match.participants
        .filter((x) => x.userId !== userId)
        .map((x) => x.user.username ?? x.user.wallet)[0],
      isDraw: p.match.result?.isDraw ?? false,
    }));
  }

  async getReplay(wallet: string, matchId: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const participant = await prisma().matchParticipant.findUnique({
      where: { matchId_userId: { matchId, userId } },
    });
    const replay = await prisma().arenaReplay.findUnique({
      where: { matchId },
      include: { match: { include: { result: true } } },
    });
    if (!replay) throw new Error("Replay not found");
    if (!participant && replay.match.status !== "COMPLETED") throw new Error("Unauthorized");

    return {
      matchId,
      timeline: replay.timeline,
      statistics: replay.statistics,
      result: replay.result,
      auditHash: replay.match.result?.auditHash,
    };
  }

  async setArenaPresence(wallet: string, status: string, matchId?: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    await prisma().arenaPresence.upsert({
      where: { userId },
      update: { status: status as any, matchId: matchId ?? null },
      create: { userId, status: status as any, matchId: matchId ?? null },
    });

    const presenceMap: Record<string, string> = {
      SEARCHING: "ARENA_SEARCHING",
      PLAYING: "ARENA_PLAYING",
      SPECTATING: "ARENA_SPECTATING",
      OFFLINE: "OFFLINE",
    };

    eventBus.publish({
      event: "ArenaPresenceChanged",
      userId,
      aggregateId: userId,
      aggregateType: "ArenaPresence",
      status,
      matchId,
    });

    return { status, matchId: matchId ?? null, aggregatedPresence: presenceMap[status] ?? "ONLINE" };
  }

  private async getFriendsInArena(wallet: string): Promise<Record<string, unknown>[]> {
    const userId = await this.resolveId(wallet);
    if (!userId) return [];

    const friends = await prisma().friendship.findMany({
      where: { userId },
      select: { friendId: true },
    });
    const friendIds = friends.map((f) => f.friendId);
    if (friendIds.length === 0) return [];

    const presences = await prisma().arenaPresence.findMany({
      where: {
        userId: { in: friendIds },
        status: { in: ["SEARCHING", "PLAYING", "SPECTATING"] },
      },
    });

    const users = await prisma().userProfile.findMany({
      where: { id: { in: presences.map((p) => p.userId) } },
      select: { id: true, wallet: true, username: true },
    });

    return presences.map((p) => {
      const user = users.find((u) => u.id === p.userId);
      return {
        wallet: user?.wallet,
        username: user?.username,
        status: p.status,
        matchId: p.matchId,
      };
    });
  }

  async createInvite(wallet: string, friendWallet: string): Promise<Record<string, unknown>> {
    const { MatchmakingEngine } = await import("./MatchmakingEngine");
    const mm = new MatchmakingEngine();
    return mm.joinQueue(wallet, "FRIEND_CHALLENGE", "PREDICTION_DUEL", { friendWallet });
  }
}
