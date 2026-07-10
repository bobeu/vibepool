import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IActivityEngine } from "./interfaces";

export class ActivityEngine implements IActivityEngine {
  name = "ActivityEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async record(wallet: string, type: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>> {
    let user = await prisma().userProfile.findUnique({
      where: { wallet },
      select: { id: true, wallet: true },
    });
    if (!user) {
      user = await prisma().userProfile.findUnique({
        where: { id: wallet },
        select: { id: true, wallet: true },
      });
    }
    if (!user) throw new Error("User not found");

    const activity = await prisma().activity.create({
      data: {
        userId: user.id,
        type: type as any,
        metadata,
      },
    });

    await prisma().userProfile.update({
      where: { id: user.id },
      data: { totalActivity: { increment: 1 } },
    });

    eventBus.publish({
      event: "ActivityRecorded",
      userId: user.id,
      wallet: user.wallet,
      activityType: type,
      metadata,
      timestamp: new Date().toISOString(),
    });

    logger.info("Activity recorded", { userId: user.id, type });
    return { id: activity.id };
  }

  async getRecent(wallet: string, limit = 20): Promise<Record<string, unknown>[]> {
    let user = await prisma().userProfile.findUnique({
      where: { wallet },
      select: { id: true },
    });
    if (!user) {
      user = await prisma().userProfile.findUnique({
        where: { id: wallet },
        select: { id: true },
      });
    }
    if (!user) return [];

    const activities = await prisma().activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return activities.map((a) => ({
      id: a.id,
      userId: a.userId,
      type: a.type,
      metadata: a.metadata,
      createdAt: a.createdAt,
    }));
  }
}
