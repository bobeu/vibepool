import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import { SocialSettingsEngine } from "./SocialSettingsEngine";
import type { IFeedEngine } from "./interfaces";

const socialSettingsEngine = new SocialSettingsEngine();

export class FeedEngine implements IFeedEngine {
  name = "FeedEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  private async resolveId(wallet: string): Promise<string | null> {
    const user = await prisma().userProfile.findUnique({
      where: { wallet },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  async getFeed(wallet: string, limit = 30): Promise<Record<string, unknown>[]> {
    const userId = await this.resolveId(wallet);
    if (!userId) return [];

    const friendships = await prisma().friendship.findMany({
      where: { userId },
      select: { friendId: true },
    });
    const friendIds = friendships.map((f) => f.friendId);

    const items = await prisma().feedItem.findMany({
      where: {
        OR: [
          { userId, visibility: "PUBLIC" },
          { userId, visibility: "FRIENDS" },
          { userId },
          ...(friendIds.length > 0
            ? [
                { userId: { in: friendIds }, visibility: "PUBLIC" as const },
                { userId: { in: friendIds }, visibility: "FRIENDS" as const },
              ]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit * 2,
      include: { actor: { select: { wallet: true, username: true } } },
    });

    const visible: typeof items = [];
    for (const item of items) {
      if (item.userId === userId) {
        visible.push(item);
        continue;
      }
      const allowed = await socialSettingsEngine.canViewActivity(userId, item.userId);
      if (allowed) visible.push(item);
      if (visible.length >= limit) break;
    }

    return visible.slice(0, limit).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      referenceType: item.referenceType,
      referenceId: item.referenceId,
      visibility: item.visibility,
      actor: item.actor?.username ?? item.actor?.wallet ?? null,
      createdAt: item.createdAt,
    }));
  }

  async publish(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const userId = (data.userId as string) || "system";
    const item = await prisma().feedItem.create({
      data: {
        userId,
        actorId: (data.actorId as string) ?? null,
        type: (data.type as any) ?? "SYSTEM",
        title: (data.title as string) ?? "",
        body: (data.body as string) ?? "",
        referenceType: (data.referenceType as string) ?? null,
        referenceId: (data.referenceId as string) ?? null,
        visibility: (data.visibility as any) ?? "PUBLIC",
      },
    });

    logger.info("Feed item published", { id: item.id, type: item.type });
    eventBus.publish({
      event: "FeedItemCreated",
      userId,
      aggregateId: item.id,
      aggregateType: "FeedItem",
      feedType: item.type,
    });
    return { id: item.id, type: item.type };
  }

  async publishForFriends(
    actorId: string,
    data: Omit<Record<string, unknown>, "userId" | "actorId">
  ): Promise<void> {
    const friendships = await prisma().friendship.findMany({
      where: { userId: actorId },
      select: { friendId: true },
    });

    await Promise.all(
      friendships.map((friendship) =>
        this.publish({
          ...data,
          userId: friendship.friendId,
          actorId,
          visibility: "FRIENDS",
        })
      )
    );
  }
}
