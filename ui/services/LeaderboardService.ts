import { prisma } from "@/lib/auth/session";
import { isGuestWallet } from "@/lib/auth/guest";
import type { ILeaderboardService } from "./interfaces";

export class LeaderboardService implements ILeaderboardService {
  name = "LeaderboardService";

  /**
   * Daily board: prefer today's snapshots; if empty, rank live UserProfiles
   * by XP/points so prediction + spin players both appear.
   */
  async getDaily(limit = 50): Promise<Record<string, unknown>[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const snapshots = await prisma().leaderboardSnapshot.findMany({
      where: { snapshotTime: { gte: startOfDay } },
      include: { user: true },
    });

    if (snapshots.length > 0) {
      const userMap = new Map<string, typeof snapshots[number]>();
      for (const s of snapshots) {
        const existing = userMap.get(s.userId);
        if (!existing || s.xp > existing.xp || (s.xp === existing.xp && s.points > existing.points)) {
          userMap.set(s.userId, s);
        }
      }

      const sorted = Array.from(userMap.values()).sort((a, b) => {
        if (b.xp !== a.xp) return b.xp - a.xp;
        if (b.points > a.points) return 1;
        if (b.points < a.points) return -1;
        return 0;
      });

      return sorted.slice(0, limit).map((s, idx) => ({
        rank: idx + 1,
        wallet: s.user.wallet,
        username: s.user.username ?? (isGuestWallet(s.user.wallet) ? "Guest Spinner" : null),
        xp: s.xp,
        points: s.points,
        spins: s.user.spins,
        predictionAccuracy: s.predictionAccuracy,
        source: "snapshot",
      }));
    }

    return this.getLiveRankings(limit);
  }

  /** Live ranking from user profiles (includes spin activity via xp/points/spins). */
  async getLiveRankings(limit = 50): Promise<Record<string, unknown>[]> {
    const users = await prisma().userProfile.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ xp: { gt: 0 } }, { points: { gt: 0 } }, { spins: { gt: 0 } }, { totalActivity: { gt: 0 } }],
      },
      orderBy: [{ xp: "desc" }, { points: "desc" }, { totalActivity: "desc" }],
      take: limit * 2,
    });

    // Prefer connected/pay wallets over guests when both present; still include guests.
    const ranked = users
      .filter((u) => !isGuestWallet(u.wallet) || u.xp > 0 || u.points > 0 || u.totalActivity > 0)
      .slice(0, limit);

    return ranked.map((u, i) => ({
      rank: i + 1,
      wallet: u.wallet,
      username: u.username ?? (isGuestWallet(u.wallet) ? "Guest Spinner" : null),
      xp: u.xp,
      points: u.points,
      spins: u.spins,
      predictionAccuracy: 0,
      source: "live",
      isSpinner: true,
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

    return snapshots.map((s) => ({
      rank: s.rank,
      wallet: s.user.wallet,
      username: s.user.username,
      xp: s.xp,
      points: s.points,
      spins: s.user.spins,
      predictionAccuracy: s.predictionAccuracy,
      snapshotTime: s.snapshotTime,
    }));
  }

  async getPersonalBest(wallet: string, limit = 10): Promise<Record<string, unknown>[]> {
    const user = await prisma().userProfile.findUnique({ where: { wallet: wallet.toLowerCase() } });
    if (!user) return [];

    const snapshots = await prisma().leaderboardSnapshot.findMany({
      where: { userId: user.id },
      include: { user: true },
      orderBy: { rank: "asc" },
      take: limit,
    });

    return snapshots.map((s) => ({
      rank: s.rank,
      wallet: s.user.wallet,
      username: s.user.username,
      xp: s.xp,
      points: s.points,
      spins: s.user.spins,
      predictionAccuracy: s.predictionAccuracy,
      snapshotTime: s.snapshotTime,
    }));
  }

  /** Upsert a daily snapshot row for a user after meaningful activity (e.g. spin finish). */
  async upsertDailyPlayer(userId: string): Promise<void> {
    const user = await prisma().userProfile.findUnique({ where: { id: userId } });
    if (!user) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existing = await prisma().leaderboardSnapshot.findFirst({
      where: { userId, snapshotTime: { gte: startOfDay } },
      orderBy: { snapshotTime: "desc" },
    });

    if (existing) {
      await prisma().leaderboardSnapshot.update({
        where: { id: existing.id },
        data: { xp: user.xp, points: user.points },
      });
      return;
    }

    const countToday = await prisma().leaderboardSnapshot.count({
      where: { snapshotTime: { gte: startOfDay } },
    });

    await prisma().leaderboardSnapshot.create({
      data: {
        userId,
        rank: countToday + 1,
        xp: user.xp,
        points: user.points,
        predictionAccuracy: 0,
        snapshotTime: new Date(),
      },
    });
  }
}
