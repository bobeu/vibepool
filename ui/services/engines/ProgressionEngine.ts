import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IProgressionEngine } from "./interfaces";

export class ProgressionEngine implements IProgressionEngine {
  name = "ProgressionEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getProgression(userId: string): Promise<Record<string, unknown>> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return {};
    }

    const lastSnapshot = await prisma().progressSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const xpDelta = profile.xp - (lastSnapshot?.xp || 0);
    const pointsDelta = profile.points - (lastSnapshot?.points || 0);

    return {
      level: profile.level,
      xp: profile.xp,
      points: profile.points,
      currentRank: profile.currentRank,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      xpDelta,
      pointsDelta,
      lastSnapshotAt: lastSnapshot?.createdAt,
    };
  }

  async snapshotProgress(userId: string, type: string): Promise<Record<string, unknown>> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return {};
    }

    const snapshot = await prisma().progressSnapshot.create({
      data: {
        userId,
        snapshotType: type,
        level: profile.level,
        xp: profile.xp,
        points: profile.points,
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
      },
    });

    logger.info("Progress snapshot created", { userId, type, snapshotId: snapshot.id });
    return { id: snapshot.id, type, createdAt: snapshot.createdAt };
  }
}
