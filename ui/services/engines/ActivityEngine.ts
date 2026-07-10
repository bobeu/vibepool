import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IActivityEngine } from "./interfaces";

export class ActivityEngine implements IActivityEngine {
  name = "ActivityEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async record(userId: string, type: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const activity = await prisma().activity.create({
      data: {
        userId,
        type: type as any,
        metadata,
      },
    });

    await prisma().userProfile.update({
      where: { id: userId },
      data: { totalActivity: { increment: 1 } },
    });

    eventBus.publish({
      event: "ActivityRecorded",
      userId,
      activityType: type,
      metadata,
      timestamp: new Date().toISOString(),
    });

    logger.info("Activity recorded", { userId, type });
    return { id: activity.id };
  }

  async getRecent(userId: string, limit = 20): Promise<Record<string, unknown>[]> {
    const activities = await prisma().activity.findMany({
      where: { userId },
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
