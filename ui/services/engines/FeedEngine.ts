import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import { SocialSettingsEngine } from "./SocialSettingsEngine";
import type { IFeedEngine } from "./interfaces";
import { compareFeedItems, feedPriorityWeight } from "@/lib/feed/priority";

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
      take: limit * 3,
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
    }

    const ranked = visible
      .sort((a, b) =>
        compareFeedItems(
          { pinned: a.pinned, rankScore: a.rankScore, createdAt: a.createdAt },
          { pinned: b.pinned, rankScore: b.rankScore, createdAt: b.createdAt }
        )
      )
      .slice(0, limit);

    return ranked.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      referenceType: item.referenceType,
      referenceId: item.referenceId,
      visibility: item.visibility,
      priority: item.priority,
      pinned: item.pinned,
      rankScore: item.rankScore,
      actor: item.actor?.username ?? item.actor?.wallet ?? null,
      createdAt: item.createdAt,
    }));
  }

  async publish(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const userId = (data.userId as string) || "system";
    const priority = (data.priority as string) ?? "NORMAL";
    const pinned = Boolean(data.pinned);
    const type = (data.type as string) ?? "SYSTEM";
    const rankScore = feedPriorityWeight(priority, type, pinned);

    const item = await prisma().feedItem.create({
      data: {
        userId,
        actorId: (data.actorId as string) ?? null,
        type: type as any,
        title: (data.title as string) ?? "",
        body: (data.body as string) ?? "",
        referenceType: (data.referenceType as string) ?? null,
        referenceId: (data.referenceId as string) ?? null,
        visibility: (data.visibility as any) ?? "PUBLIC",
        priority: priority as any,
        pinned,
        rankScore,
      },
    });

    logger.info("Feed item published", { id: item.id, type: item.type, rankScore });
    eventBus.publish({
      event: "FeedItemCreated",
      userId,
      aggregateId: item.id,
      aggregateType: "FeedItem",
      feedType: item.type,
    });
    return { id: item.id, type: item.type, rankScore };
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
