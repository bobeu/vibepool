import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { INotificationEngine } from "./interfaces";

export class NotificationEngine implements INotificationEngine {
  name = "NotificationEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async send(
    userId: string,
    type: string,
    title: string,
    body: string,
    priority = "NORMAL",
    expiresAt?: Date,
    scheduledAt?: Date,
    recurring = false
  ): Promise<Record<string, unknown>> {
    const notification = await prisma().notification.create({
      data: {
        userId,
        type: type as any,
        title,
        body,
        priority: priority as any,
        expiresAt,
        scheduledAt,
        recurring,
      },
    });

    eventBus.publish({
      event: "NotificationQueued",
      userId,
      notificationId: notification.id,
      type,
      title,
      priority,
      scheduledAt: scheduledAt?.toISOString(),
      recurring,
    });

    logger.info("Notification sent", { userId, type, title, scheduledAt });
    return { id: notification.id };
  }

  async getUnread(userId: string): Promise<Record<string, unknown>[]> {
    const now = new Date();
    const notifications = await prisma().notification.findMany({
      where: {
        userId,
        read: false,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
          {
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: now } },
            ],
          },
        ],
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      readAt: n.readAt,
      priority: n.priority,
      expiresAt: n.expiresAt,
      scheduledAt: n.scheduledAt,
      recurring: n.recurring,
      createdAt: n.createdAt,
    }));
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma().notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return;
    }

    await prisma().notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    eventBus.publish({
      event: "NotificationRead",
      userId,
      notificationId,
    });
  }

  async getScheduled(limit = 50): Promise<Record<string, unknown>[]> {
    const now = new Date();
    const notifications = await prisma().notification.findMany({
      where: {
        scheduledAt: { lte: now },
        read: false,
      },
      take: limit,
      orderBy: { scheduledAt: "asc" },
    });

    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      scheduledAt: n.scheduledAt,
      recurring: n.recurring,
      createdAt: n.createdAt,
    }));
  }
}
