import { prisma } from "@/lib/auth/session";
import { arenaAnalytics } from "@/lib/arena/ArenaAnalytics";
import { QueueSimulator } from "@/lib/arena/QueueSimulator";

export class AdminDashboardEngine {
  name = "AdminDashboardEngine";

  async getDashboard(): Promise<Record<string, unknown>> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      onlineUsers,
      queueSize,
      activeMatches,
      liveEvents,
      activeSeason,
      activeCampaigns,
      enabledFlags,
      pendingJobs,
      deadLetterJobs,
      pendingRewards,
      fraudAlerts,
      recentErrors,
    ] = await Promise.all([
      prisma().userProfile.count(),
      prisma().userProfile.count({ where: { lastLogin: { gte: dayAgo } } }),
      prisma().arenaPresence.count({ where: { status: { not: "OFFLINE" } } }),
      prisma().arenaQueue.count({ where: { status: { in: ["SEARCHING", "MATCHED"] } } }),
      prisma().arenaMatch.count({ where: { status: { in: ["WAITING", "PLAYING", "COUNTDOWN"] } } }),
      prisma().liveEvent.count({ where: { status: "ACTIVE" } }),
      prisma().season.findFirst({ where: { status: "ACTIVE" } }),
      prisma().campaign.count({ where: { status: "ACTIVE" } }),
      prisma().featureFlag.count({ where: { enabled: true } }),
      prisma().scheduledJob.count({ where: { status: "PENDING" } }),
      prisma().scheduledJob.count({ where: { status: "DEAD_LETTER" } }),
      prisma().pendingReward.count({ where: { status: "PENDING" } }),
      prisma().referral.count({ where: { fraudStatus: "FLAGGED" } }),
      prisma().auditLog.count({ where: { action: { contains: "ERROR" }, createdAt: { gte: dayAgo } } }),
    ]);

    const arenaMetrics = await arenaAnalytics.getSummary(dayAgo);

    return {
      players: { total: totalUsers, active24h: activeUsers, online: onlineUsers },
      arena: { queueSize, activeMatches, metrics: arenaMetrics },
      liveOps: {
        liveEvents,
        activeSeason: activeSeason ? { id: activeSeason.id, number: activeSeason.number, name: activeSeason.name } : null,
        activeCampaigns,
        enabledFlags,
      },
      scheduler: { pending: pendingJobs, deadLetter: deadLetterJobs, healthy: deadLetterJobs === 0 },
      rewards: { pending: pendingRewards },
      moderation: { fraudAlerts },
      system: { errors24h: recentErrors, status: deadLetterJobs === 0 ? "healthy" : "degraded" },
    };
  }

  async getBetaDashboard(): Promise<Record<string, unknown>> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeBetaUsers,
      failedSettlements,
      failedRewards,
      apiErrors,
      moderationReports,
      sessions,
      betaEvents,
    ] = await Promise.all([
      prisma().userProfile.count({ where: { lastLogin: { gte: weekAgo } } }),
      prisma().pendingReward.count({ where: { status: "FAILED" } }),
      prisma().pendingReward.count({ where: { status: { in: ["FAILED", "PROCESSING"] } } }),
      prisma().auditLog.count({ where: { action: { contains: "ERROR" }, createdAt: { gte: dayAgo } } }),
      prisma().moderationReport.findMany({ where: { status: "PENDING" }, take: 5, orderBy: { createdAt: "desc" } }),
      prisma().session.findMany({
        where: { createdAt: { gte: weekAgo }, revoked: false },
        select: { createdAt: true, expiresAt: true },
        take: 500,
      }),
      prisma().telemetryEvent.findMany({
        where: { source: "analytics", recordedAt: { gte: weekAgo } },
        orderBy: { recordedAt: "desc" },
        take: 200,
      }),
    ]);

    const avgSessionMs =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.expiresAt.getTime() - s.createdAt.getTime()), 0) / sessions.length
        : 0;

    const funnel: Record<string, number> = {};
    for (const e of betaEvents) {
      funnel[e.eventType] = (funnel[e.eventType] ?? 0) + 1;
    }

    return {
      activeBetaUsers,
      crashes: apiErrors,
      failedTransactions: failedSettlements,
      apiFailures24h: apiErrors,
      settlementFailures: failedRewards,
      topReportedIssues: moderationReports.map((r) => ({ type: r.type, reason: r.reason, createdAt: r.createdAt })),
      averageSessionMinutes: Math.round(avgSessionMs / 60_000),
      betaFunnel: funnel,
      generatedAt: now.toISOString(),
    };
  }
}

export class UserManagementEngine {
  name = "UserManagementEngine";

  async search(query: string, limit = 20): Promise<Record<string, unknown>[]> {
    const users = await prisma().userProfile.findMany({
      where: {
        OR: [
          { wallet: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    return users.map((u) => ({
      id: u.id,
      wallet: u.wallet,
      username: u.username,
      status: u.status,
      xp: u.xp,
      level: u.level,
      lastLogin: u.lastLogin,
    }));
  }

  async getProfile(userId: string): Promise<Record<string, unknown>> {
    const user = await prisma().userProfile.findUnique({
      where: { id: userId },
      include: {
        activities: { take: 20, orderBy: { createdAt: "desc" } },
        userAchievements: { take: 20 },
        matchParticipants: { take: 10, orderBy: { createdAt: "desc" }, include: { match: true } },
        pendingRewards: { take: 10 },
        userMissions: { take: 10, include: { mission: true } },
        referralsMade: { take: 10 },
        sessions: { take: 5, orderBy: { createdAt: "desc" } },
        seasonProgress: { include: { season: true } },
      },
    });
    if (!user) throw new Error("User not found");
    return user as unknown as Record<string, unknown>;
  }

  async suspendUser(userId: string, reason: string): Promise<Record<string, unknown>> {
    const user = await prisma().userProfile.update({
      where: { id: userId },
      data: { status: "SUSPENDED" },
    });
    return { id: user.id, status: user.status, reason };
  }

  async unsuspendUser(userId: string): Promise<Record<string, unknown>> {
    const user = await prisma().userProfile.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });
    return { id: user.id, status: user.status };
  }

  async shadowBan(userId: string, reason: string): Promise<Record<string, unknown>> {
    const user = await prisma().userProfile.update({
      where: { id: userId },
      data: { status: "SHADOW_BANNED" },
    });
    return { id: user.id, status: user.status, reason };
  }

  async resetSeasonProgress(userId: string): Promise<Record<string, unknown>> {
    await prisma().seasonProgress.deleteMany({ where: { userId } });
    return { userId, reset: true };
  }

  async grantCompensation(userId: string, xp: number, points: number): Promise<Record<string, unknown>> {
    const user = await prisma().userProfile.update({
      where: { id: userId },
      data: { xp: { increment: xp }, points: { increment: points } },
    });
    return { id: user.id, xpGranted: xp, pointsGranted: points };
  }

  async forceLogout(userId: string): Promise<Record<string, unknown>> {
    await prisma().session.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
    return { userId, loggedOut: true };
  }
}

export class ModerationEngine {
  name = "ModerationEngine";

  async listReports(status?: string, limit = 50): Promise<Record<string, unknown>[]> {
    const reports = await prisma().moderationReport.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return reports;
  }

  async createReport(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const report = await prisma().moderationReport.create({
      data: {
        reporterId: (data.reporterId as string) ?? null,
        targetUserId: (data.targetUserId as string) ?? null,
        targetPostId: (data.targetPostId as string) ?? null,
        type: (data.type as string) ?? "ABUSE",
        reason: (data.reason as string) ?? "",
        status: "PENDING",
      },
    });
    return report as unknown as Record<string, unknown>;
  }

  async resolveReport(reportId: string, resolution: string, resolvedBy: string, approve: boolean): Promise<Record<string, unknown>> {
    const report = await prisma().moderationReport.update({
      where: { id: reportId },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        resolution,
        resolvedBy,
        resolvedAt: new Date(),
      },
    });

    if (!approve && report.targetPostId) {
      await prisma().communityPost.update({
        where: { id: report.targetPostId },
        data: { active: false },
      });
    }

    return report as unknown as Record<string, unknown>;
  }

  async listFraudSignals(limit = 50): Promise<Record<string, unknown>[]> {
    return prisma().referral.findMany({
      where: { fraudStatus: "FLAGGED" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export class AdminAnalyticsEngine {
  name = "AdminAnalyticsEngine";

  async getMetrics(): Promise<Record<string, unknown>> {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const month = 30 * day;

    const [dau, wau, mau, arenaMatches, missionCompletions, spins, referrals, achievements] = await Promise.all([
      prisma().userProfile.count({ where: { lastLogin: { gte: new Date(now.getTime() - day) } } }),
      prisma().userProfile.count({ where: { lastLogin: { gte: new Date(now.getTime() - week) } } }),
      prisma().userProfile.count({ where: { lastLogin: { gte: new Date(now.getTime() - month) } } }),
      prisma().arenaMatch.count({ where: { createdAt: { gte: new Date(now.getTime() - week) } } }),
      prisma().userMission.count({ where: { completed: true, updatedAt: { gte: new Date(now.getTime() - week) } } }),
      prisma().spinHistory.count({ where: { createdAt: { gte: new Date(now.getTime() - week) } } }),
      prisma().referral.count({ where: { createdAt: { gte: new Date(now.getTime() - month) } } }),
      prisma().userAchievement.count({ where: { unlocked: true, unlockedAt: { gte: new Date(now.getTime() - month) } } }),
    ]);

    const arenaSummary = await arenaAnalytics.getSummary(new Date(now.getTime() - week));

    return {
      dau,
      wau,
      mau,
      retention: { dauOverMau: mau > 0 ? dau / mau : 0 },
      arena: { matchesWeek: arenaMatches, metrics: arenaSummary },
      engagement: { missionCompletions, spins, referrals, achievements },
      revenue: { placeholder: true, note: "Future integration" },
    };
  }
}

export class ArenaOpsEngine {
  name = "ArenaOpsEngine";

  async getOperations(): Promise<Record<string, unknown>> {
    const [queues, matches, failedSettlements] = await Promise.all([
      prisma().arenaQueue.findMany({
        where: { status: { in: ["SEARCHING", "MATCHED", "ACCEPTED"] } },
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      prisma().arenaMatch.findMany({
        where: { status: { in: ["WAITING", "PLAYING", "COUNTDOWN", "SETTLING"] } },
        take: 50,
        include: { participants: true },
      }),
      prisma().arenaResult.count({ where: { settled: false } }),
    ]);

    const ratings = await prisma().arenaRating.findMany({ take: 200, select: { skillRating: true } });
    const distribution: Record<string, number> = {};
    for (const r of ratings) {
      const bucket = Math.floor(r.skillRating / 100) * 100;
      distribution[String(bucket)] = (distribution[String(bucket)] ?? 0) + 1;
    }

    const simulator = new QueueSimulator();
    const simulation = simulator.runBenchmark();

    return { queues, matches, failedSettlements, ratingDistribution: distribution, queueSimulation: simulation };
  }

  async cancelQueue(queueId: string): Promise<Record<string, unknown>> {
    await prisma().arenaQueue.update({ where: { id: queueId }, data: { status: "CANCELLED" } });
    return { queueId, cancelled: true };
  }

  async forceEndMatch(matchId: string): Promise<Record<string, unknown>> {
    const { ResultEngine } = await import("../ResultEngine");
    const engine = new ResultEngine();
    return engine.finalizeMatch(matchId);
  }
}
