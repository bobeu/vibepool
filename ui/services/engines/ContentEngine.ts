import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IContentEngine } from "./interfaces";

export class ContentEngine implements IContentEngine {
  name = "ContentEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getBlocks(placement?: string, locale = "en"): Promise<Record<string, unknown>[]> {
    const now = new Date();
    let blocks = await prisma().contentBlock.findMany({
      where: {
        active: true,
        locale,
        ...(placement ? { placement: placement as any } : {}),
        OR: [{ startAt: null }, { startAt: { lte: now } }],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    if (blocks.length === 0 && locale !== "en") {
      blocks = await prisma().contentBlock.findMany({
        where: {
          active: true,
          locale: "en",
          ...(placement ? { placement: placement as any } : {}),
          OR: [{ startAt: null }, { startAt: { lte: now } }],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });
    }

    return blocks
      .filter((b) => !b.endAt || b.endAt >= now)
      .map((b) => ({
        id: b.id,
        type: b.type,
        title: b.title,
        body: b.body,
        imageUrl: b.imageUrl,
        ctaLabel: b.ctaLabel,
        ctaUrl: b.ctaUrl,
        placement: b.placement,
        priority: b.priority,
        version: b.version,
        locale: b.locale,
      }));
  }

  async listLocales(placement?: string): Promise<string[]> {
    const blocks = await prisma().contentBlock.findMany({
      where: { active: true, ...(placement ? { placement: placement as any } : {}) },
      select: { locale: true },
      distinct: ["locale"],
    });
    return blocks.map((b) => b.locale);
  }

  async createBlock(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const block = await prisma().contentBlock.create({
      data: {
        type: (data.type as any) ?? "HERO_BANNER",
        title: (data.title as string) ?? "",
        body: (data.body as string) ?? "",
        imageUrl: (data.imageUrl as string) ?? null,
        ctaLabel: (data.ctaLabel as string) ?? null,
        ctaUrl: (data.ctaUrl as string) ?? null,
        placement: (data.placement as any) ?? "HOME_HERO",
        priority: Number(data.priority ?? 0),
        active: data.active !== false,
        startAt: data.startAt ? new Date(data.startAt as string) : null,
        endAt: data.endAt ? new Date(data.endAt as string) : null,
        audience: (data.audience as object) ?? undefined,
        locale: (data.locale as string) ?? "en",
      },
    });

    logger.info("Content block created", { id: block.id, type: block.type });
    return { id: block.id, type: block.type, title: block.title };
  }

  async getHeroBanner(wallet?: string): Promise<Record<string, unknown> | null> {
    const blocks = await this.getBlocks("HOME_HERO");
    if (blocks.length === 0) {
      return {
        title: "Welcome to NEXORA",
        subtitle: "Compete. Progress. Win.",
        ctaLabel: "Play Now",
        ctaUrl: "/arena",
        fallback: true,
      };
    }
    return blocks[0];
  }
}
