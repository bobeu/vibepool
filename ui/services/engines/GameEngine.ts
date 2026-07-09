import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { PredictionEngine } from "./PredictionEngine";
import { ScoringEngine } from "./ScoringEngine";
import { RankingEngine } from "./RankingEngine";
import { XPRewardEngine } from "./XPRewardEngine";
import { RewardEngine } from "./RewardEngine";
import { SettlementEngine } from "./SettlementEngine";
import { AuditEngine } from "./AuditEngine";
import type { IGameEngine } from "./interfaces";

export class GameEngine implements IGameEngine {
  name = "GameEngine";

  private predictionEngine = new PredictionEngine();
  private scoringEngine = new ScoringEngine();
  private rankingEngine = new RankingEngine();
  private xpRewardEngine = new XPRewardEngine();
  private rewardEngine = new RewardEngine();
  private settlementEngine = new SettlementEngine();
  private auditEngine = new AuditEngine();

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async orchestrate(tournamentId: string): Promise<Record<string, unknown>> {
    const tournament = await prisma().tournament.findUnique({
      where: { id: tournamentId },
      include: { predictions: { include: { user: true } } },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const execution = await prisma().gameExecution.create({
      data: {
        tournamentId,
        engineVersion: "1.0.0",
        status: "RUNNING",
      },
    });

    await this.auditEngine.log("EVALUATION_STARTED", "Tournament", tournamentId);

    try {
      const predictions = await this.predictionEngine.evaluatePredictions(
        tournamentId,
        tournament.actualValue ?? 0
      );

      const settings = await prisma().settings.findMany();
      const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

      const scored = await this.scoringEngine.calculateScores(predictions, settingsMap);
      const ranked = await this.rankingEngine.rankPlayers(
        scored,
        `${tournamentId}-${tournament.seasonNumber}-${tournament.dailyNumber}`
      );

      const pendingRewards = await this.rewardEngine.generatePendingRewards(
        tournamentId,
        ranked
      );

      const settlementResults = await this.settlementEngine.processPendingRewards(100);

      const snapshotOps = ranked.map((player) =>
        prisma().leaderboardSnapshot.create({
          data: {
            tournamentId,
            userId: player.userId as string,
            rank: (player.rank as number) || 0,
            xp: 0,
            points: 0,
            predictionAccuracy: (player.accuracy as number) || undefined,
            snapshotTime: new Date(),
          },
        })
      );

      const updateOps = [];
      for (const player of ranked) {
        const xpAwarded = this.xpRewardEngine.calculateXP(settingsMap, {
          participation: true,
          correct: ((player.accuracy as number) ?? 0) >= 0.9,
          rank: player.rank as number,
          totalParticipants: ranked.length,
        });

        const profile = await prisma().userProfile.findUnique({
          where: { id: player.userId as string },
        });

        if (profile) {
          updateOps.push(
            prisma().userProfile.update({
              where: { id: player.userId as string },
              data: {
                xp: { increment: xpAwarded },
                currentRank: player.rank as number,
              },
            })
          );
        }
      }

      await prisma().$transaction([...updateOps, ...snapshotOps]);

      await prisma().gameExecution.update({
        where: { id: execution.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      await this.auditEngine.log(
        "EVALUATION_COMPLETED",
        "Tournament",
        tournamentId,
        { players: ranked.length }
      );

      await prisma().tournament.update({
        where: { id: tournamentId },
        data: { status: "COMPLETED" },
      });

      logger.info("Tournament orchestrated", {
        tournamentId,
        players: ranked.length,
        executionId: execution.id,
      });

      return {
        tournamentId,
        executionId: execution.id,
        rankedPlayers: ranked,
        rewards: pendingRewards,
      };
    } catch (error) {
      await prisma().gameExecution.update({
        where: { id: execution.id },
        data: { status: "FAILED", errors: { message: (error as Error).message } },
      });

      await this.auditEngine.log("EVALUATION_FAILED", "Tournament", tournamentId, {
        error: (error as Error).message,
      });

      logger.error("Tournament orchestration failed", {
        tournamentId,
        error: (error as Error).message,
      });

      throw error;
    }
  }
}
