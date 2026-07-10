import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IPresenceEngine } from "./interfaces";

const PRESENCE_TTL_MS = Number(process.env.PRESENCE_TTL_MS ?? 5 * 60 * 1000);

export class PresenceEngine implements IPresenceEngine {
  name = "PresenceEngine";

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

  async setPresence(wallet: string, status: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const expiresAt = status === "OFFLINE" || status === "INVISIBLE" ? null : new Date(Date.now() + PRESENCE_TTL_MS);

    await prisma().presence.upsert({
      where: { userId },
      update: { status: status as any, lastActive: new Date(), expiresAt },
      create: { userId, status: status as any, expiresAt },
    });

    eventBus.publish({
      event: "PresenceChanged",
      userId,
      aggregateId: userId,
      aggregateType: "Presence",
      status,
    });

    return { status, expiresAt };
  }

  async getPresence(wallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) return { status: "OFFLINE" };

    const presence = await prisma().presence.findUnique({ where: { userId } });
    if (!presence) return { status: "OFFLINE" };

    const expired = presence.expiresAt && presence.expiresAt.getTime() < Date.now();
    const status = expired ? "OFFLINE" : presence.status;
    return { status, lastActive: presence.lastActive };
  }

  async getFriendsPresence(wallet: string): Promise<Record<string, unknown>[]> {
    const userId = await this.resolveId(wallet);
    if (!userId) return [];

    const friendships = await prisma().friendship.findMany({
      where: { userId },
      select: { friendId: true },
    });
    const friendIds = friendships.map((f) => f.friendId);
    if (friendIds.length === 0) return [];

    const presences = await prisma().presence.findMany({
      where: { userId: { in: friendIds } },
    });

    const online = presences.filter((p) => {
      if (p.status === "INVISIBLE" || p.status === "OFFLINE") return false;
      if (p.expiresAt && p.expiresAt.getTime() < Date.now()) return false;
      return true;
    });

    const { SocialSettingsEngine } = await import("./SocialSettingsEngine");
    const socialSettings = new SocialSettingsEngine();

    const visible = [];
    for (const p of online) {
      const showStatus = await socialSettings.showOnlineStatus(p.userId);
      if (showStatus) visible.push(p);
    }

    return visible.map((p) => ({ userId: p.userId, status: p.status, lastActive: p.lastActive }));
  }
}
