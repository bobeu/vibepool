import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IPresenceEngine } from "./interfaces";

const PRESENCE_TTL_MS = Number(process.env.PRESENCE_TTL_MS ?? 5 * 60 * 1000);

const STATUS_PRIORITY: Record<string, number> = {
  ARENA_PLAYING: 100,
  PLAYING_TOURNAMENT: 90,
  ARENA_SEARCHING: 80,
  SPINNING: 70,
  ARENA_SPECTATING: 60,
  VIEWING_LEADERBOARD: 50,
  ONLINE: 40,
  AWAY: 30,
  OFFLINE: 0,
  INVISIBLE: 0,
};

function aggregateStatus(sessions: Array<{ status: string; expiresAt: Date | null }>): string {
  const now = Date.now();
  const active = sessions.filter((s) => {
    if (s.status === "OFFLINE" || s.status === "INVISIBLE") return false;
    if (s.expiresAt && s.expiresAt.getTime() < now) return false;
    return true;
  });
  if (active.length === 0) return "OFFLINE";
  return active.sort((a, b) => (STATUS_PRIORITY[b.status] ?? 0) - (STATUS_PRIORITY[a.status] ?? 0))[0].status;
}

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

  async setPresence(
    wallet: string,
    status: string,
    options?: { deviceId?: string; deviceType?: string }
  ): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const deviceId = options?.deviceId ?? "default";
    const deviceType = options?.deviceType ?? "WEB";
    const expiresAt = status === "OFFLINE" || status === "INVISIBLE" ? null : new Date(Date.now() + PRESENCE_TTL_MS);

    await prisma().presenceSession.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      update: { status: status as any, lastActive: new Date(), expiresAt, deviceType },
      create: { userId, deviceId, deviceType, status: status as any, expiresAt },
    });

    const sessions = await prisma().presenceSession.findMany({ where: { userId } });
    const aggregated = aggregateStatus(sessions);

    await prisma().presence.upsert({
      where: { userId },
      update: { status: aggregated as any, lastActive: new Date(), expiresAt },
      create: { userId, status: aggregated as any, expiresAt },
    });

    eventBus.publish({
      event: "PresenceChanged",
      userId,
      aggregateId: userId,
      aggregateType: "Presence",
      status: aggregated,
      deviceId,
      deviceType,
    });

    return { status: aggregated, deviceId, deviceType, expiresAt, sessions: sessions.length };
  }

  async getPresence(wallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) return { status: "OFFLINE" };

    const presence = await prisma().presence.findUnique({ where: { userId } });
    const sessions = await prisma().presenceSession.findMany({ where: { userId } });

    if (!presence && sessions.length === 0) return { status: "OFFLINE" };

    const aggregated = aggregateStatus(
      sessions.map((s) => ({ status: s.status, expiresAt: s.expiresAt }))
    );

    return {
      status: aggregated,
      lastActive: presence?.lastActive,
      sessions: sessions.map((s) => ({
        deviceId: s.deviceId,
        deviceType: s.deviceType,
        status: s.status,
        lastActive: s.lastActive,
      })),
    };
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
