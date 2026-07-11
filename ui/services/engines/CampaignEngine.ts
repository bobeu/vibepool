import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { ICampaignEngine } from "./interfaces";

function snapshotCampaign(c: Record<string, unknown>): Record<string, unknown> {
  return {
    name: c.name,
    description: c.description,
    type: c.type,
    status: c.status,
    startAt: c.startAt,
    endAt: c.endAt,
    config: c.config,
    version: c.version,
  };
}

export class CampaignEngine implements ICampaignEngine {
  name = "CampaignEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async listCampaigns(status?: string): Promise<Record<string, unknown>[]> {
    const campaigns = await prisma().campaign.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { targets: true, versions: true } } },
    });

    return campaigns.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      description: c.description,
      status: c.status,
      startAt: c.startAt,
      endAt: c.endAt,
      version: c.version,
      targetCount: c._count.targets,
      versionCount: c._count.versions,
    }));
  }

  private async saveVersion(campaignId: string, createdBy?: string): Promise<void> {
    const campaign = await prisma().campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return;
    await prisma().campaignVersion.create({
      data: {
        campaignId,
        version: campaign.version,
        snapshot: snapshotCampaign(campaign as unknown as Record<string, unknown>),
        createdBy: createdBy ?? null,
      },
    });
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

    await this.saveVersion(campaign.id, data.createdBy as string | undefined);
    logger.info("Campaign created", { id: campaign.id, type: campaign.type });
    return { id: campaign.id, name: campaign.name, status: campaign.status, version: 1 };
  }

  async startCampaign(campaignId: string): Promise<Record<string, unknown>> {
    const campaign = await prisma().campaign.update({
      where: { id: campaignId },
      data: { status: "ACTIVE", startAt: new Date(), version: { increment: 1 } },
    });
    await this.saveVersion(campaignId);

    eventBus.publish({
      event: "CampaignStarted",
      aggregateId: campaign.id,
      aggregateType: "Campaign",
      name: campaign.name,
      type: campaign.type,
    });

    return { id: campaign.id, status: campaign.status, version: campaign.version };
  }

  async pauseCampaign(campaignId: string): Promise<Record<string, unknown>> {
    const campaign = await prisma().campaign.update({
      where: { id: campaignId },
      data: { status: "PAUSED", version: { increment: 1 } },
    });
    await this.saveVersion(campaignId);
    return { id: campaign.id, status: campaign.status };
  }

  async resumeCampaign(campaignId: string): Promise<Record<string, unknown>> {
    const campaign = await prisma().campaign.update({
      where: { id: campaignId },
      data: { status: "ACTIVE", version: { increment: 1 } },
    });
    await this.saveVersion(campaignId);
    return { id: campaign.id, status: campaign.status };
  }

  async cloneCampaign(campaignId: string, createdBy?: string): Promise<Record<string, unknown>> {
    const source = await prisma().campaign.findUnique({ where: { id: campaignId } });
    if (!source) throw new Error("Campaign not found");

    const clone = await prisma().campaign.create({
      data: {
        seasonId: source.seasonId,
        type: source.type,
        name: `${source.name} (Copy)`,
        description: source.description,
        status: "DRAFT",
        config: source.config ?? undefined,
      },
    });
    await this.saveVersion(clone.id, createdBy);
    return { id: clone.id, name: clone.name, clonedFrom: campaignId };
  }

  async getVersionHistory(campaignId: string): Promise<Record<string, unknown>[]> {
    const versions = await prisma().campaignVersion.findMany({
      where: { campaignId },
      orderBy: { version: "desc" },
    });
    return versions.map((v) => ({
      version: v.version,
      snapshot: v.snapshot,
      createdBy: v.createdBy,
      createdAt: v.createdAt,
    }));
  }

  async rollbackCampaign(campaignId: string, version: number): Promise<Record<string, unknown>> {
    const record = await prisma().campaignVersion.findUnique({
      where: { campaignId_version: { campaignId, version } },
    });
    if (!record) throw new Error("Version not found");

    const snap = record.snapshot as Record<string, unknown>;
    const campaign = await prisma().campaign.update({
      where: { id: campaignId },
      data: {
        name: snap.name as string,
        description: (snap.description as string) ?? null,
        status: snap.status as any,
        config: (snap.config as object) ?? undefined,
        version: { increment: 1 },
      },
    });
    await this.saveVersion(campaignId);
    return { id: campaign.id, rolledBackTo: version, version: campaign.version };
  }

  async completeCampaign(campaignId: string): Promise<Record<string, unknown>> {
    const campaign = await prisma().campaign.update({
      where: { id: campaignId },
      data: { status: "COMPLETED", endAt: new Date(), version: { increment: 1 } },
    });
    await this.saveVersion(campaignId);

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
