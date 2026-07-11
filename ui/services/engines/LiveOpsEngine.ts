import { prisma } from "@/lib/auth/session";
import { eventBus } from "./EventBus";
import type { ILiveOpsEngine } from "./interfaces";

export class LiveOpsEngine implements ILiveOpsEngine {
  name = "LiveOpsEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getDashboard(): Promise<Record<string, unknown>> {
    const [activeSeason, activeEvents, activeCampaigns, pendingJobs, flags] = await Promise.all([
      prisma().season.findFirst({ where: { status: "ACTIVE" } }),
      prisma().liveEvent.findMany({ where: { status: "ACTIVE" }, take: 5 }),
      prisma().campaign.findMany({ where: { status: "ACTIVE" }, take: 5 }),
      prisma().scheduledJob.count({ where: { status: "PENDING" } }),
      prisma().featureFlag.count({ where: { enabled: true } }),
    ]);

    return {
      activeSeason: activeSeason ? { id: activeSeason.id, number: activeSeason.number, name: activeSeason.name } : null,
      activeEvents: activeEvents.length,
      activeCampaigns: activeCampaigns.length,
      pendingJobs,
      enabledFlags: flags,
    };
  }

  async listEvents(limit = 20): Promise<Record<string, unknown>[]> {
    const events = await prisma().liveEvent.findMany({
      orderBy: { startAt: "desc" },
      take: limit,
    });
    return events.map((e) => ({
      id: e.id,
      type: e.type,
      name: e.name,
      description: e.description,
      status: e.status,
      startAt: e.startAt,
      endAt: e.endAt,
    }));
  }

  async createEvent(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const event = await prisma().liveEvent.create({
      data: {
        seasonId: (data.seasonId as string) ?? null,
        type: (data.type as any) ?? "WEEKEND",
        name: (data.name as string) ?? "Live Event",
        description: (data.description as string) ?? null,
        status: (data.status as any) ?? "SCHEDULED",
        startAt: new Date(data.startAt as string),
        endAt: new Date(data.endAt as string),
        config: (data.config as object) ?? undefined,
      },
    });

    if (event.status === "ACTIVE") {
      eventBus.publish({
        event: "LiveEventStarted",
        aggregateId: event.id,
        aggregateType: "LiveEvent",
        name: event.name,
        type: event.type,
      });
    }

    return { id: event.id, name: event.name, status: event.status };
  }

  async activateDueEvents(): Promise<number> {
    const now = new Date();
    const due = await prisma().liveEvent.findMany({
      where: { status: "SCHEDULED", startAt: { lte: now }, endAt: { gt: now } },
    });

    for (const e of due) {
      await prisma().liveEvent.update({ where: { id: e.id }, data: { status: "ACTIVE" } });
      eventBus.publish({
        event: "LiveEventStarted",
        aggregateId: e.id,
        aggregateType: "LiveEvent",
        name: e.name,
      });
    }

    const ended = await prisma().liveEvent.updateMany({
      where: { status: "ACTIVE", endAt: { lte: now } },
      data: { status: "ENDED" },
    });

    if (ended.count > 0) {
      eventBus.publish({ event: "LiveEventEnded", aggregateType: "LiveEvent", count: ended.count });
    }

    return due.length;
  }

  async getBanners(placement?: string, wallet?: string): Promise<Record<string, unknown>[]> {
    const now = new Date();
    const banners = await prisma().banner.findMany({
      where: {
        active: true,
        ...(placement ? { placement: placement as any } : {}),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    let dismissed: string[] = [];
    if (wallet) {
      const user = await prisma().userProfile.findUnique({ where: { wallet }, select: { id: true } });
      if (user) {
        const d = await prisma().bannerDismissal.findMany({ where: { userId: user.id }, select: { bannerId: true } });
        dismissed = d.map((x) => x.bannerId);
      }
    }

    return banners
      .filter((b) => (!b.startAt || b.startAt <= now) && (!b.endAt || b.endAt >= now))
      .filter((b) => !dismissed.includes(b.id))
      .map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        ctaLabel: b.ctaLabel,
        ctaUrl: b.ctaUrl,
        placement: b.placement,
        priority: b.priority,
      }));
  }

  async publishBanner(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const banner = await prisma().banner.create({
      data: {
        title: (data.title as string) ?? "",
        subtitle: (data.subtitle as string) ?? null,
        imageUrl: (data.imageUrl as string) ?? null,
        ctaLabel: (data.ctaLabel as string) ?? null,
        ctaUrl: (data.ctaUrl as string) ?? null,
        placement: (data.placement as any) ?? "HOME_HERO",
        priority: Number(data.priority ?? 0),
        active: true,
        startAt: data.startAt ? new Date(data.startAt as string) : new Date(),
        endAt: data.endAt ? new Date(data.endAt as string) : null,
      },
    });

    eventBus.publish({
      event: "BannerPublished",
      aggregateId: banner.id,
      aggregateType: "Banner",
      title: banner.title,
      placement: banner.placement,
    });

    return { id: banner.id, title: banner.title };
  }

  async dismissBanner(wallet: string, bannerId: string): Promise<void> {
    const user = await prisma().userProfile.findUnique({ where: { wallet }, select: { id: true } });
    if (!user) return;
    await prisma().bannerDismissal.upsert({
      where: { userId_bannerId: { userId: user.id, bannerId } },
      update: {},
      create: { userId: user.id, bannerId },
    });
  }
}
