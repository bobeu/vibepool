import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { ICampaignEngine } from "./interfaces";

export class CampaignEngine implements ICampaignEngine {
  name = "CampaignEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async listCampaigns(status?: string): Promise<Record<string, unknown>[]> {
    const campaigns = await prisma().campaign.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { targets: true } } },
    });

    return campaigns.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      description: c.description,
      status: c.status,
      startAt: c.startAt,
      endAt: c.endAt,
      targetCount: c._count.targets,
    }));
  }

  async createCampaign(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const campaign = await prisma().campaign.create({
      data: {
        seasonId: (data.seasonId as string) ?? null,
        type: (data.type as any) ?? "RETENTION",
        name: (data.name as string) ?? "Campaign",
        description: (data.description as string) ?? null,
        status: (data.status as any) ?? "DRAFT",
        startAt: data.startAt ? new Date(data.startAt as string) : null,
        endAt: data.endAt ? new Date(data.endAt as string) : null,
        config: (data.config as object) ?? undefined,
      },
    });

    logger.info("Campaign created", { id: campaign.id, type: campaign.type });
    return { id: campaign.id, name: campaign.name, status: campaign.status };
  }

  async startCampaign(campaignId: string): Promise<Record<string, unknown>> {
    const campaign = await prisma().campaign.update({
      where: { id: campaignId },
      data: { status: "ACTIVE", startAt: new Date() },
    });

    eventBus.publish({
      event: "CampaignStarted",
      aggregateId: campaign.id,
      aggregateType: "Campaign",
      name: campaign.name,
      type: campaign.type,
    });

    return { id: campaign.id, status: campaign.status };
  }

  async completeCampaign(campaignId: string): Promise<Record<string, unknown>> {
    const campaign = await prisma().campaign.update({
      where: { id: campaignId },
      data: { status: "COMPLETED", endAt: new Date() },
    });

    eventBus.publish({
      event: "CampaignCompleted",
      aggregateId: campaign.id,
      aggregateType: "Campaign",
      name: campaign.name,
    });

    return { id: campaign.id, status: campaign.status };
  }

  async addTarget(campaignId: string, data: Record<string, unknown>): Promise<void> {
    await prisma().campaignTarget.create({
      data: {
        campaignId,
        userId: (data.userId as string) ?? null,
        segment: (data.segment as string) ?? null,
        metadata: (data.metadata as object) ?? undefined,
      },
    });
  }

  async activateDueCampaigns(): Promise<number> {
    const now = new Date();
    const due = await prisma().campaign.findMany({
      where: {
        status: "SCHEDULED",
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gt: now } }],
      },
    });

    for (const c of due) {
      await this.startCampaign(c.id);
    }
    return due.length;
  }
}
