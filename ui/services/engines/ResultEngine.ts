import { createHash } from "crypto";
import { prisma } from "@/lib/auth/session";
import { arenaAnalytics } from "@/lib/arena/ArenaAnalytics";
import { ArenaStateMachine, type ArenaState } from "@/lib/arena/ArenaStateMachine";
import { compressReplay } from "@/lib/arena/replayCompression";
import {
  ARENA_POINTS_WIN,
  ARENA_XP_LOSS,
  ARENA_XP_WIN,
  DEFAULT_RATING,
  leagueForRating,
} from "@/lib/arena/constants";
import { eventBus } from "./EventBus";
import { RatingStrategyRegistry } from "./rating/RatingStrategyRegistry";
import { getActiveSeasonNumber } from "./SeasonEngine";
import type { IResultEngine } from "./interfaces";
import type { RatingSnapshot } from "./rating/IRatingStrategy";

function accuracy(prediction: number, actual: number): number {
  const diff = Math.abs(prediction - actual);
  return Math.max(0, 100 - diff / Math.max(actual, 1));
}

export class ResultEngine implements IResultEngine {
  name = "ResultEngine";
  private ratingStrategy = RatingStrategyRegistry.get();

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  private transitionStatus(current: string, event: Parameters<ArenaStateMachine["transition"]>[0]): ArenaState {
    const sm = new ArenaStateMachine(current as ArenaState);
    return sm.transition(event);
  }

  async finalizeMatch(matchId: string): Promise<Record<string, unknown>> {
    const match = await prisma().arenaMatch.findUnique({
      where: { id: matchId },
      include: { participants: true },
    });
    if (!match || match.participants.length < 2) throw new Error("Invalid match");
    if (match.status === "COMPLETED" || match.status === "SETTLING") {
      return { matchId, status: match.status, duplicate: true };
    }

    const target = match.targetValue ?? Math.floor(Math.random() * 9000) + 1000;
    const scored = match.participants.map((p) => ({
      ...p,
      score: accuracy(p.prediction ?? 0, target),
    }));

    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const isDraw = scored.length >= 2 && scored[0].score === scored[1].score;
    const winner = isDraw ? null : scored[0];
    const loser = isDraw ? null : scored[1];

    const finishedStatus = this.transitionStatus(match.status, "SUBMIT_PREDICTIONS");
    await prisma().arenaMatch.update({
      where: { id: matchId },
      data: { status: finishedStatus, targetValue: target, finishedAt: new Date() },
    });

    for (const p of scored) {
      let outcome: "WIN" | "LOSS" | "DRAW" = "DRAW";
      if (!isDraw && winner && p.userId === winner.userId) outcome = "WIN";
      else if (!isDraw && loser && p.userId === loser.userId) outcome = "LOSS";

      await prisma().matchParticipant.update({
        where: { matchId_userId: { matchId, userId: p.userId } },
        data: { score: p.score, outcome: outcome as any },
      });
    }

    const auditPayload = {
      matchId,
      target,
      scores: scored.map((s) => ({ userId: s.userId, prediction: s.prediction, score: s.score })),
      winnerId: winner?.userId ?? null,
      isDraw,
    };
    const auditHash = createHash("sha256").update(JSON.stringify(auditPayload)).digest("hex");

    await prisma().arenaResult.create({
      data: {
        matchId,
        winnerId: winner?.userId ?? null,
        loserId: loser?.userId ?? null,
        isDraw,
        auditHash,
        metadata: auditPayload,
      },
    });

    const timeline = [
      { at: match.startedAt, event: "MATCH_STARTED" },
      ...scored.map((s) => ({ at: new Date(), event: "PREDICTION", userId: s.userId, prediction: s.prediction })),
      { at: new Date(), event: "RESULT", target, winnerId: winner?.userId ?? null, isDraw },
    ];
    const compressed = compressReplay({
      timeline,
      statistics: { target, scores: scored.map((s) => ({ userId: s.userId, score: s.score })) },
      result: { winnerId: winner?.userId ?? null, isDraw },
    });

    await prisma().arenaReplay.create({
      data: {
        matchId,
        timeline: compressed.timeline as object,
        statistics: compressed.statistics as object,
        result: compressed.result as object,
        compressed: compressed.compressed,
        compressionFormat: compressed.compressionFormat,
        checkpoints: compressed.checkpoints as object,
      },
    });

    const settlingStatus = this.transitionStatus(finishedStatus, "FINALIZE");
    await prisma().arenaMatch.update({ where: { id: matchId }, data: { status: settlingStatus } });

    const ratingUpdates = await this.updateRatings(matchId, scored, isDraw, winner?.userId, loser?.userId);
    await this.settleRewards(matchId, scored, isDraw, winner?.userId);

    const completedStatus = this.transitionStatus(settlingStatus, "SETTLE");
    await prisma().arenaMatch.update({ where: { id: matchId }, data: { status: completedStatus } });
    await prisma().arenaQueue.updateMany({
      where: { matchId },
      data: { status: "ACCEPTED" },
    });

    if (match.startedAt) {
      await arenaAnalytics.record("MATCH_DURATION_MS", Date.now() - match.startedAt.getTime(), { matchId });
    }
    await arenaAnalytics.record("COMPLETION_RATE", 1, { matchId });

    eventBus.publish({
      event: "ArenaMatchCompleted",
      aggregateId: matchId,
      aggregateType: "ArenaMatch",
      winnerId: winner?.userId ?? null,
      isDraw,
      playerIds: scored.map((s) => s.userId),
      auditHash,
    });

    return { matchId, status: completedStatus, winnerId: winner?.userId ?? null, isDraw, ratingUpdates, auditHash };
  }

  private async updateRatings(
    matchId: string,
    participants: Array<{ userId: string; score?: number | null }>,
    isDraw: boolean,
    winnerId?: string,
    loserId?: string
  ): Promise<Record<string, unknown>[]> {
    if (participants.length < 2) return [];

    const seasonNumber = await getActiveSeasonNumber();
    const [a, b] = participants;
    const ratingA = await this.getRatingSnapshot(a.userId, seasonNumber);
    const ratingB = await this.getRatingSnapshot(b.userId, seasonNumber);

    const outcomeA = isDraw ? "DRAW" : a.userId === winnerId ? "WIN" : "LOSS";
    const outcomeB = isDraw ? "DRAW" : b.userId === winnerId ? "WIN" : "LOSS";

    const updatedA = this.ratingStrategy.updateRating({ player: ratingA, opponent: ratingB, outcome: outcomeA });
    const updatedB = this.ratingStrategy.updateRating({ player: ratingB, opponent: ratingA, outcome: outcomeB });

    await arenaAnalytics.record("RATING_DIFF", Math.abs(ratingA.skillRating - ratingB.skillRating), { matchId });

    await this.persistRating(a.userId, seasonNumber, updatedA, outcomeA);
    await this.persistRating(b.userId, seasonNumber, updatedB, outcomeB);

    await prisma().matchParticipant.update({
      where: { matchId_userId: { matchId, userId: a.userId } },
      data: { ratingBefore: ratingA.skillRating, ratingAfter: updatedA.skillRating },
    });
    await prisma().matchParticipant.update({
      where: { matchId_userId: { matchId, userId: b.userId } },
      data: { ratingBefore: ratingB.skillRating, ratingAfter: updatedB.skillRating },
    });

    return [
      { userId: a.userId, before: ratingA.skillRating, after: updatedA.skillRating },
      { userId: b.userId, before: ratingB.skillRating, after: updatedB.skillRating },
    ];
  }

  private async getRatingSnapshot(userId: string, seasonNumber: number): Promise<RatingSnapshot> {
    const row = await prisma().arenaRating.upsert({
      where: { userId_seasonNumber: { userId, seasonNumber } },
      update: {},
      create: { userId, seasonNumber, skillRating: DEFAULT_RATING, league: leagueForRating(DEFAULT_RATING) },
    });
    return {
      skillRating: row.skillRating,
      ratingDeviation: row.ratingDeviation,
      matchesPlayed: row.matchesPlayed,
      winRate: row.winRate,
      currentStreak: row.currentStreak,
      bestStreak: row.bestStreak,
    };
  }

  private async persistRating(userId: string, seasonNumber: number, rating: RatingSnapshot, outcome: string): Promise<void> {
    const league = leagueForRating(rating.skillRating);
    await prisma().arenaRating.update({
      where: { userId_seasonNumber: { userId, seasonNumber } },
      data: {
        skillRating: rating.skillRating,
        ratingDeviation: rating.ratingDeviation,
        matchesPlayed: rating.matchesPlayed,
        winRate: rating.winRate,
        currentStreak: rating.currentStreak,
        bestStreak: rating.bestStreak,
        league,
      },
    });

    const stats = await prisma().arenaSeasonStatistic.upsert({
      where: { userId_seasonNumber: { userId, seasonNumber } },
      update: {},
      create: { userId, seasonNumber },
    });

    await prisma().arenaSeasonStatistic.update({
      where: { id: stats.id },
      data: {
        totalMatches: stats.totalMatches + 1,
        wins: stats.wins + (outcome === "WIN" ? 1 : 0),
        losses: stats.losses + (outcome === "LOSS" ? 1 : 0),
        draws: stats.draws + (outcome === "DRAW" ? 1 : 0),
        peakRating: Math.max(stats.peakRating, rating.skillRating),
      },
    });
  }

  private async settleRewards(
    matchId: string,
    participants: Array<{ userId: string }>,
    isDraw: boolean,
    winnerId?: string
  ): Promise<void> {
    for (const p of participants) {
      const won = !isDraw && p.userId === winnerId;
      const xp = won ? ARENA_XP_WIN : ARENA_XP_LOSS;

      eventBus.publish({
        event: "ArenaRewardEligible",
        userId: p.userId,
        aggregateId: matchId,
        aggregateType: "ArenaMatch",
        won,
        xp,
        points: won ? ARENA_POINTS_WIN : 0,
      });

      await prisma().activity.create({
        data: {
          userId: p.userId,
          type: "SOCIAL",
          metadata: { kind: "ARENA_MATCH", matchId, won, isDraw },
        },
      });

      await prisma().playerStatistic.upsert({
        where: { userId_type: { userId: p.userId, type: "ARENA_MATCHES" } },
        update: { value: { increment: 1 } },
        create: { userId: p.userId, type: "ARENA_MATCHES", value: 1 },
      });

      if (won) {
        await prisma().playerStatistic.upsert({
          where: { userId_type: { userId: p.userId, type: "ARENA_WINS" } },
          update: { value: { increment: 1 } },
          create: { userId: p.userId, type: "ARENA_WINS", value: 1 },
        });
      }
    }

    await prisma().arenaResult.updateMany({
      where: { matchId },
      data: { settled: true, settledAt: new Date() },
    });
  }
}
