import { prisma } from "@/lib/auth/session";
import type { ILeaderboardService, ITournamentService } from "./interfaces";

export class LeaderboardService implements ILeaderboardService {
  name = "LeaderboardService";

  async getDaily(limit = 50): Promise<Record<string, unknown>[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const snapshots = await prisma().leaderboardSnapshot.findMany({
      where: { snapshotTime: { gte: startOfDay } },
      include: { user: true },
      orderBy: { rank: "asc" },
      take: limit,
    });

    return snapshots.map(s => ({
      rank: s.rank,
      wallet: s.user.wallet,
      username: s.user.username,
      xp: s.xp,
      points: s.user.points,
      predictionAccuracy: s.predictionAccuracy,
    }));
  }

  async getHistorical(_tournamentId?: string): Promise<Record<string, unknown>[]> {
    const where = _tournamentId ? { tournamentId: _tournamentId } : {};
    
    const snapshots = await prisma().leaderboardSnapshot.findMany({
      where,
      include: { user: true },
      orderBy: { snapshotTime: "desc" },
      take: 100,
    });

    return snapshots.map(s => ({
      rank: s.rank,
      wallet: s.user.wallet,
      username: s.user.username,
      xp: s.xp,
      points: s.points,
      predictionAccuracy: s.predictionAccuracy,
      snapshotTime: s.snapshotTime,
    }));
  }

  async getPersonalBest(wallet: string, limit = 10): Promise<Record<string, unknown>[]> {
    const snapshots = await prisma().leaderboardSnapshot.findMany({
      where: { userId: wallet },
      include: { user: true },
      orderBy: { rank: "asc" },
      take: limit,
    });

    return snapshots.map(s => ({
      rank: s.rank,
      wallet: s.user.wallet,
      username: s.user.username,
      xp: s.xp,
      points: s.points,
      predictionAccuracy: s.predictionAccuracy,
      snapshotTime: s.snapshotTime,
    }));
  }
}
