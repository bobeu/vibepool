import { prisma } from "@/lib/auth/session";
import { COUNTDOWN_SECONDS } from "@/lib/arena/constants";
import { ArenaStateMachine, type ArenaEvent, type ArenaState } from "@/lib/arena/ArenaStateMachine";
import { eventBus } from "./EventBus";
import type { IMatchEngine } from "./interfaces";

export class MatchEngine implements IMatchEngine {
  name = "MatchEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  private async resolveId(wallet: string): Promise<string | null> {
    const user = await prisma().userProfile.findUnique({ where: { wallet }, select: { id: true } });
    return user?.id ?? null;
  }

  private transitionStatus(current: string, event: ArenaEvent): ArenaState {
    const sm = new ArenaStateMachine(current as ArenaState);
    return sm.transition(event);
  }

  async acceptMatch(wallet: string, matchId: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const participant = await prisma().matchParticipant.findUnique({
      where: { matchId_userId: { matchId, userId } },
    });
    if (!participant) throw new Error("Not a participant");

    await prisma().matchParticipant.update({
      where: { matchId_userId: { matchId, userId } },
      data: { accepted: true },
    });

    await prisma().arenaQueue.updateMany({
      where: { userId, matchId },
      data: { status: "ACCEPTED" },
    });

    const participants = await prisma().matchParticipant.findMany({ where: { matchId } });
    const allAccepted = participants.length >= 2 && participants.every((p) => p.accepted);

    const match = await prisma().arenaMatch.findUnique({ where: { id: matchId } });
    if (!match) throw new Error("Match not found");

    if (allAccepted) {
      await this.transitionToCountdown(matchId, match.status);
    }

    eventBus.publish({
      event: "ArenaMatchAccepted",
      userId,
      aggregateId: matchId,
      aggregateType: "ArenaMatch",
    });

    const updated = await prisma().arenaMatch.findUnique({ where: { id: matchId } });
    return { matchId, accepted: true, status: updated?.status ?? match.status };
  }

  private async transitionToCountdown(matchId: string, currentStatus: string): Promise<void> {
    const countdownStatus = this.transitionStatus(currentStatus, "ALL_ACCEPTED");
    await prisma().arenaMatch.update({
      where: { id: matchId },
      data: { status: countdownStatus, startedAt: new Date(Date.now() + COUNTDOWN_SECONDS * 1000) },
    });

    eventBus.publish({
      event: "ArenaMatchCountdown",
      aggregateId: matchId,
      aggregateType: "ArenaMatch",
      seconds: COUNTDOWN_SECONDS,
    });

    const playingStatus = this.transitionStatus(countdownStatus, "COUNTDOWN_DONE");
    await prisma().arenaMatch.update({
      where: { id: matchId },
      data: { status: playingStatus },
    });

    eventBus.publish({
      event: "ArenaMatchStarted",
      aggregateId: matchId,
      aggregateType: "ArenaMatch",
    });
  }

  async submitPrediction(wallet: string, matchId: string, prediction: number): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const match = await prisma().arenaMatch.findUnique({ where: { id: matchId } });
    if (!match || match.status !== "PLAYING") throw new Error("Match not in playing state");

    await prisma().matchParticipant.update({
      where: { matchId_userId: { matchId, userId } },
      data: { prediction },
    });

    eventBus.publish({
      event: "ArenaPredictionSubmitted",
      userId,
      aggregateId: matchId,
      aggregateType: "ArenaMatch",
      prediction,
    });

    const participants = await prisma().matchParticipant.findMany({ where: { matchId } });
    const allSubmitted = participants.length >= 2 && participants.every((p) => p.prediction != null);

    if (allSubmitted) {
      const { ResultEngine } = await import("./ResultEngine");
      const resultEngine = new ResultEngine();
      return resultEngine.finalizeMatch(matchId);
    }

    return { matchId, prediction, waiting: true };
  }

  async getMatch(wallet: string, matchId: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const match = await prisma().arenaMatch.findUnique({
      where: { id: matchId },
      include: {
        participants: { include: { user: { select: { wallet: true, username: true } } } },
        result: true,
        replay: true,
      },
    });
    if (!match) throw new Error("Match not found");

    const isParticipant = match.participants.some((p) => p.userId === userId);
    if (!isParticipant && match.status !== "COMPLETED") {
      throw new Error("Unauthorized");
    }

    return {
      id: match.id,
      status: match.status,
      matchType: match.matchType,
      mode: match.mode,
      targetValue: match.status === "COMPLETED" || match.status === "FINISHED" ? match.targetValue : null,
      inviteCode: match.inviteCode,
      participants: match.participants.map((p) => ({
        wallet: p.user.wallet,
        username: p.user.username,
        accepted: p.accepted,
        prediction: p.prediction,
        score: p.score,
        outcome: p.outcome,
        ratingBefore: p.ratingBefore,
        ratingAfter: p.ratingAfter,
      })),
      result: match.result,
      startedAt: match.startedAt,
      finishedAt: match.finishedAt,
    };
  }

  async declineMatch(wallet: string, matchId: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const match = await prisma().arenaMatch.findUnique({ where: { id: matchId } });
    const archivedStatus = match ? this.transitionStatus(match.status, "DECLINE") : "ARCHIVED";

    await prisma().arenaMatch.update({
      where: { id: matchId },
      data: { status: archivedStatus },
    });
    await prisma().arenaQueue.updateMany({
      where: { matchId, userId },
      data: { status: "DECLINED" },
    });

    eventBus.publish({
      event: "ArenaMatchDeclined",
      userId,
      aggregateId: matchId,
      aggregateType: "ArenaMatch",
    });

    return { matchId, declined: true };
  }

  async expireWaitingMatches(): Promise<number> {
    const now = new Date();
    const waiting = await prisma().arenaMatch.findMany({
      where: { status: "WAITING", expiresAt: { lt: now } },
    });

    for (const match of waiting) {
      const archived = this.transitionStatus(match.status, "EXPIRE");
      await prisma().arenaMatch.update({ where: { id: match.id }, data: { status: archived } });
    }
    return waiting.length;
  }
}
