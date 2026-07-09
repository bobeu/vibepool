import { TournamentStatus } from "@prisma/client";
import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { GameEngine } from "@/services/engines/GameEngine";
import type { ITournamentService } from "./interfaces";

export class TournamentService implements ITournamentService {
  name = "TournamentService";
  private gameEngine = new GameEngine();

  async createTournament(data: {
    name: string;
    startTime: Date;
    endTime: Date;
    rewardPool: number;
    asset: string;
    maxPlayers: number;
    seasonNumber: number;
    dailyNumber: number;
  }): Promise<Record<string, unknown>> {
    const tournament = await prisma().tournament.create({
      data: {
        ...data,
        status: TournamentStatus.UPCOMING,
        currentPlayers: 0,
      },
      include: { predictions: true },
    });

    logger.info("Tournament created", { tournamentId: tournament.id, name: tournament.name });
    return this.toResponse(tournament);
  }

  async startTournament(id: string): Promise<Record<string, unknown>> {
    const tournament = await prisma().tournament.update({
      where: { id },
      data: { status: TournamentStatus.OPEN },
      include: { predictions: true },
    });

    logger.info("Tournament started", { tournamentId: tournament.id });
    return this.toResponse(tournament);
  }

  async lockTournament(id: string): Promise<Record<string, unknown>> {
    const tournament = await prisma().tournament.update({
      where: { id },
      data: { status: TournamentStatus.LOCKED },
      include: { predictions: true },
    });

    logger.info("Tournament locked", { tournamentId: tournament.id });
    return this.toResponse(tournament);
  }

  async evaluateTournament(id: string, actualValue: number): Promise<Record<string, unknown>> {
    await prisma().tournament.update({
      where: { id },
      data: { status: TournamentStatus.EVALUATING, actualValue },
    });

    const result = await this.gameEngine.orchestrate(id);
    return result;
  }

  async completeTournament(id: string): Promise<Record<string, unknown>> {
    const tournament = await prisma().tournament.update({
      where: { id },
      data: { status: TournamentStatus.COMPLETED },
      include: { predictions: true },
    });

    await prisma().leaderboardSnapshot.createMany({
      data: tournament.predictions.map((p) => ({
        tournamentId: id,
        userId: p.userId,
        rank: p.rankPoints,
        xp: p.xpAwarded,
        points: p.user.points,
        predictionAccuracy: p.accuracy ?? undefined,
        snapshotTime: new Date(),
      })),
    });

    logger.info("Tournament completed", { tournamentId: id });
    return this.toResponse(tournament);
  }

  async archiveTournament(id: string): Promise<Record<string, unknown>> {
    const tournament = await prisma().tournament.update({
      where: { id },
      data: { status: TournamentStatus.ARCHIVED },
    });

    logger.info("Tournament archived", { tournamentId: id });
    return this.toResponse(tournament);
  }

  async getTournament(id: string): Promise<Record<string, unknown> | null> {
    const tournament = await prisma().tournament.findUnique({
      where: { id },
      include: { predictions: { include: { user: true } } },
    });

    return tournament ? this.toResponse(tournament) : null;
  }

  async getActive(): Promise<Record<string, unknown>[]> {
    const tournaments = await prisma().tournament.findMany({
      where: { status: { in: [TournamentStatus.OPEN, TournamentStatus.LOCKED, TournamentStatus.EVALUATING] } },
      include: { predictions: { include: { user: true } } },
      orderBy: { startTime: "desc" },
    });

    return tournaments.map((t) => this.toResponse(t));
  }

  async getCurrentTournament(): Promise<Record<string, unknown> | null> {
    const tournament = await prisma().tournament.findFirst({
      where: { status: TournamentStatus.OPEN },
      include: { predictions: { include: { user: true } } },
      orderBy: { startTime: "desc" },
    });

    return tournament ? this.toResponse(tournament) : null;
  }

  async getUpcomingTournament(): Promise<Record<string, unknown> | null> {
    const tournament = await prisma().tournament.findFirst({
      where: { status: TournamentStatus.UPCOMING },
      orderBy: { startTime: "asc" },
    });

    return tournament ? this.toResponse(tournament) : null;
  }

  private toResponse(tournament: Record<string, unknown>): Record<string, unknown> {
    return {
      id: tournament.id,
      name: tournament.name,
      startTime: tournament.startTime,
      endTime: tournament.endTime,
      status: tournament.status,
      rewardPool: tournament.rewardPool,
      asset: tournament.asset,
      maxPlayers: tournament.maxPlayers,
      currentPlayers: tournament.currentPlayers,
      seasonNumber: tournament.seasonNumber,
      dailyNumber: tournament.dailyNumber,
      predictions: tournament.predictions,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
    };
  }
}
