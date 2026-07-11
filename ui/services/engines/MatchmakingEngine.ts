import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import {
  DEFAULT_RATING,
  INVITE_EXPIRY_MS,
  MATCH_ACCEPT_TIMEOUT_MS,
  QUEUE_TIMEOUT_MS,
  leagueForRating,
} from "@/lib/arena/constants";
import { arenaAnalytics } from "@/lib/arena/ArenaAnalytics";
import { eventBus } from "./EventBus";
import { getActiveSeasonNumber } from "./SeasonEngine";
import type { IMatchmakingEngine } from "./interfaces";

function shortCode(length = 6): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += charset[Math.floor(Math.random() * charset.length)];
  }
  return code;
}

export class MatchmakingEngine implements IMatchmakingEngine {
  name = "MatchmakingEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  private async resolveId(wallet: string): Promise<string | null> {
    const user = await prisma().userProfile.findUnique({ where: { wallet }, select: { id: true } });
    return user?.id ?? null;
  }

  private async getOrCreateRating(userId: string): Promise<number> {
    const seasonNumber = await getActiveSeasonNumber();
    const rating = await prisma().arenaRating.upsert({
      where: { userId_seasonNumber: { userId, seasonNumber } },
      update: {},
      create: { userId, seasonNumber, skillRating: DEFAULT_RATING, league: leagueForRating(DEFAULT_RATING) },
    });
    return rating.skillRating;
  }

  private async assertNoActiveQueue(userId: string): Promise<void> {
    const active = await prisma().arenaQueue.findFirst({
      where: { userId, status: { in: ["SEARCHING", "MATCHED", "ACCEPTED"] } },
    });
    if (active) throw new Error("Already in queue");
  }

  async joinQueue(
    wallet: string,
    mode: string,
    matchType = "PREDICTION_DUEL",
    options?: { friendWallet?: string; inviteCode?: string }
  ): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    await this.assertNoActiveQueue(userId);
    await this.expireStaleQueues();

    const rating = await this.getOrCreateRating(userId);
    const expiresAt = new Date(Date.now() + QUEUE_TIMEOUT_MS);

    if (mode === "FRIEND_CHALLENGE" && options?.friendWallet) {
      return this.createFriendChallenge(userId, wallet, options.friendWallet, matchType);
    }

    if (mode === "PRIVATE_MATCH" || mode === "INVITE_CODE") {
      return this.createPrivateMatch(userId, mode as any, matchType);
    }

    const queue = await prisma().arenaQueue.create({
      data: {
        userId,
        mode: mode as any,
        matchType: matchType as any,
        status: "SEARCHING",
        rating,
        expiresAt,
      },
    });

    eventBus.publish({
      event: "ArenaQueueJoined",
      userId,
      aggregateId: queue.id,
      aggregateType: "ArenaQueue",
      mode,
      matchType,
    });

    const paired = await this.tryPair(queue.id, userId, matchType, rating);
    if (paired) return paired;

    return { queueId: queue.id, status: "SEARCHING", expiresAt };
  }

  private async createPrivateMatch(userId: string, mode: string, matchType: string): Promise<Record<string, unknown>> {
    const inviteCode = shortCode(8);
    const match = await prisma().arenaMatch.create({
      data: {
        matchType: matchType as any,
        mode: mode as any,
        status: "WAITING",
        inviteCode,
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
        participants: { create: [{ userId, accepted: true }] },
      },
    });

    await prisma().arenaQueue.create({
      data: {
        userId,
        matchId: match.id,
        mode: mode as any,
        matchType: matchType as any,
        status: "MATCHED",
        expiresAt: match.expiresAt,
      },
    });

    return { matchId: match.id, inviteCode, status: "WAITING" };
  }

  private async createFriendChallenge(
    senderId: string,
    senderWallet: string,
    friendWallet: string,
    matchType: string
  ): Promise<Record<string, unknown>> {
    const receiver = await prisma().userProfile.findUnique({ where: { wallet: friendWallet }, select: { id: true } });
    if (!receiver) throw new Error("Friend not found");

    const friendship = await prisma().friendship.findFirst({
      where: { OR: [{ userId: senderId, friendId: receiver.id }, { userId: receiver.id, friendId: senderId }] },
    });
    if (!friendship) throw new Error("Not friends");

    const code = shortCode(8);
    const match = await prisma().arenaMatch.create({
      data: {
        matchType: matchType as any,
        mode: "FRIEND_CHALLENGE",
        status: "WAITING",
        expiresAt: new Date(Date.now() + MATCH_ACCEPT_TIMEOUT_MS),
        participants: { create: [{ userId: senderId, accepted: true }] },
      },
    });

    await prisma().arenaInvitation.create({
      data: {
        matchId: match.id,
        senderId,
        receiverId: receiver.id,
        code,
        expiresAt: new Date(Date.now() + MATCH_ACCEPT_TIMEOUT_MS),
      },
    });

    await prisma().arenaQueue.create({
      data: {
        userId: senderId,
        matchId: match.id,
        mode: "FRIEND_CHALLENGE",
        matchType: matchType as any,
        status: "MATCHED",
        expiresAt: match.expiresAt,
      },
    });

    eventBus.publish({
      event: "ArenaInvitationSent",
      userId: senderId,
      receiverId: receiver.id,
      aggregateId: match.id,
      aggregateType: "ArenaMatch",
      code,
      senderWallet,
    });

    return { matchId: match.id, invitationCode: code, status: "WAITING" };
  }

  private async tryPair(
    queueId: string,
    userId: string,
    matchType: string,
    rating: number
  ): Promise<Record<string, unknown> | null> {
    const window = 150;
    const opponent = await prisma().arenaQueue.findFirst({
      where: {
        id: { not: queueId },
        userId: { not: userId },
        status: "SEARCHING",
        matchType: matchType as any,
        rating: { gte: rating - window, lte: rating + window },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!opponent) return null;

    const queueRow = await prisma().arenaQueue.findUnique({ where: { id: queueId } });
    const queueTimeMs = queueRow?.createdAt ? Date.now() - queueRow.createdAt.getTime() : 0;
    await arenaAnalytics.record("QUEUE_TIME_MS", queueTimeMs, { queueId, userId });
    await arenaAnalytics.record("RATING_DIFF", Math.abs(rating - opponent.rating), { queueId, userId, opponentId: opponent.userId });

    const targetValue = Math.floor(Math.random() * 9000) + 1000;
    const match = await prisma().arenaMatch.create({
      data: {
        matchType: matchType as any,
        mode: "QUICK_MATCH",
        status: "WAITING",
        targetValue,
        expiresAt: new Date(Date.now() + MATCH_ACCEPT_TIMEOUT_MS),
        participants: {
          create: [{ userId: opponent.userId }, { userId }],
        },
      },
    });

    await prisma().arenaQueue.updateMany({
      where: { id: { in: [queueId, opponent.id] } },
      data: { status: "MATCHED", matchId: match.id },
    });

    eventBus.publish({
      event: "ArenaMatchFound",
      aggregateId: match.id,
      aggregateType: "ArenaMatch",
      playerIds: [userId, opponent.userId],
    });

    return { matchId: match.id, status: "WAITING", targetValue };
  }

  async cancelQueue(wallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const updated = await prisma().arenaQueue.updateMany({
      where: { userId, status: { in: ["SEARCHING", "MATCHED"] } },
      data: { status: "CANCELLED" },
    });

    return { cancelled: updated.count > 0 };
  }

  async getQueueStatus(wallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) return { status: "OFFLINE" };

    const queue = await prisma().arenaQueue.findFirst({
      where: { userId, status: { in: ["SEARCHING", "MATCHED", "ACCEPTED"] } },
      include: { match: true },
      orderBy: { createdAt: "desc" },
    });

    if (!queue) return { status: "IDLE" };
    return {
      queueId: queue.id,
      status: queue.status,
      matchId: queue.matchId,
      matchStatus: queue.match?.status ?? null,
      expiresAt: queue.expiresAt,
    };
  }

  async joinByInviteCode(wallet: string, inviteCode: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    await this.assertNoActiveQueue(userId);

    const match = await prisma().arenaMatch.findFirst({
      where: { inviteCode, status: "WAITING" },
      include: { participants: true },
    });
    if (!match) throw new Error("Invalid or expired invite");
    if (match.participants.length >= 2) throw new Error("Match is full");
    if (match.participants.some((p) => p.userId === userId)) throw new Error("Already in match");

    await prisma().matchParticipant.create({ data: { matchId: match.id, userId } });
    await prisma().arenaQueue.create({
      data: {
        userId,
        matchId: match.id,
        mode: "INVITE_CODE",
        matchType: match.matchType,
        status: "MATCHED",
        expiresAt: match.expiresAt,
      },
    });

    return { matchId: match.id, status: match.status };
  }

  async expireStaleQueues(): Promise<number> {
    const now = new Date();
    const expired = await prisma().arenaQueue.updateMany({
      where: { status: "SEARCHING", expiresAt: { lt: now } },
      data: { status: "EXPIRED" },
    });
    return expired.count;
  }

  async createRematch(wallet: string, previousMatchId: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const previous = await prisma().arenaMatch.findUnique({
      where: { id: previousMatchId },
      include: { participants: true },
    });
    if (!previous) throw new Error("Match not found");
    if (!previous.participants.some((p) => p.userId === userId)) throw new Error("Not a participant");

    const opponentId = previous.participants.find((p) => p.userId !== userId)?.userId;
    if (!opponentId) throw new Error("No opponent for rematch");

    const match = await prisma().arenaMatch.create({
      data: {
        matchType: previous.matchType,
        mode: "REMATCH",
        status: "WAITING",
        targetValue: Math.floor(Math.random() * 9000) + 1000,
        expiresAt: new Date(Date.now() + MATCH_ACCEPT_TIMEOUT_MS),
        metadata: { rematchOf: previousMatchId },
        participants: { create: [{ userId }, { userId: opponentId }] },
      },
    });

    await prisma().arenaQueue.createMany({
      data: [
        { userId, matchId: match.id, mode: "REMATCH", matchType: match.matchType, status: "MATCHED", expiresAt: match.expiresAt },
        { userId: opponentId, matchId: match.id, mode: "REMATCH", matchType: match.matchType, status: "MATCHED", expiresAt: match.expiresAt },
      ],
    });

    await arenaAnalytics.record("REMATCH_RATE", 1, { previousMatchId, matchId: match.id });

    return { matchId: match.id, status: "WAITING" };
  }
}

export function auditHash(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function randomRequestId(): string {
  return randomBytes(16).toString("hex");
}
