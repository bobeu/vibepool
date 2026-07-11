import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { ICommunityEngine } from "./interfaces";

export class CommunityEngine implements ICommunityEngine {
  name = "CommunityEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getPosts(limit = 20): Promise<Record<string, unknown>[]> {
    const highlightTypes = [
      "WEEKLY_SPOTLIGHT",
      "FEATURED_TOURNAMENT",
      "FEATURED_PLAYER",
      "FEATURED_ACHIEVEMENT",
      "CHAMPION",
      "FEATURED",
    ];

    const posts = await prisma().communityPost.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: limit * 2,
      include: { author: { select: { wallet: true, username: true } } },
    });

    const sorted = posts.sort((a, b) => {
      const aHighlight = highlightTypes.includes(a.type) ? 1 : 0;
      const bHighlight = highlightTypes.includes(b.type) ? 1 : 0;
      if (aHighlight !== bHighlight) return bHighlight - aHighlight;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return sorted.slice(0, limit).map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      body: p.body,
      referenceId: p.referenceId,
      author: p.author.username ?? p.author.wallet,
      createdAt: p.createdAt,
    }));
  }

  async createPost(authorWallet: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const author = await prisma().userProfile.findUnique({
      where: { wallet: authorWallet },
      select: { id: true },
    });
    if (!author) throw new Error("User not found");

    const post = await prisma().communityPost.create({
      data: {
        authorId: author.id,
        type: (data.type as any) ?? "ANNOUNCEMENT",
        title: (data.title as string) ?? "Announcement",
        body: (data.body as string) ?? "",
        referenceId: (data.referenceId as string) ?? null,
        active: true,
      },
    });

    logger.info("Community post created", { id: post.id, type: post.type });

    eventBus.publish({
      event: "CommunityAnnouncement",
      userId: author.id,
      aggregateId: post.id,
      aggregateType: "CommunityPost",
      title: post.title,
      body: post.body,
    });

    return {
      id: post.id,
      type: post.type,
      title: post.title,
      body: post.body,
    };
  }
}
