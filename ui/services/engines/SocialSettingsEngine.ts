import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";

type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

const DEFAULTS = {
  profileVisibility: "PUBLIC" as Visibility,
  activityVisibility: "FRIENDS" as Visibility,
  onlineStatus: true,
  friendRequests: true,
  referralVisibility: "PRIVATE" as Visibility,
};

export class SocialSettingsEngine {
  name = "SocialSettingsEngine";

  private async resolveId(wallet: string): Promise<string | null> {
    const user = await prisma().userProfile.findUnique({
      where: { wallet },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  async getSettings(wallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const settings = await prisma().socialSettings.upsert({
      where: { userId },
      update: {},
      create: { userId, ...DEFAULTS },
    });

    return {
      profileVisibility: settings.profileVisibility,
      activityVisibility: settings.activityVisibility,
      onlineStatus: settings.onlineStatus,
      friendRequests: settings.friendRequests,
      referralVisibility: settings.referralVisibility,
    };
  }

  async updateSettings(wallet: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const settings = await prisma().socialSettings.upsert({
      where: { userId },
      update: {
        profileVisibility: (data.profileVisibility as Visibility) ?? undefined,
        activityVisibility: (data.activityVisibility as Visibility) ?? undefined,
        onlineStatus: data.onlineStatus !== undefined ? Boolean(data.onlineStatus) : undefined,
        friendRequests: data.friendRequests !== undefined ? Boolean(data.friendRequests) : undefined,
        referralVisibility: (data.referralVisibility as Visibility) ?? undefined,
      },
      create: {
        userId,
        profileVisibility: (data.profileVisibility as Visibility) ?? DEFAULTS.profileVisibility,
        activityVisibility: (data.activityVisibility as Visibility) ?? DEFAULTS.activityVisibility,
        onlineStatus: data.onlineStatus !== undefined ? Boolean(data.onlineStatus) : DEFAULTS.onlineStatus,
        friendRequests: data.friendRequests !== undefined ? Boolean(data.friendRequests) : DEFAULTS.friendRequests,
        referralVisibility: (data.referralVisibility as Visibility) ?? DEFAULTS.referralVisibility,
      },
    });

    logger.info("Social settings updated", { userId });
    return {
      profileVisibility: settings.profileVisibility,
      activityVisibility: settings.activityVisibility,
      onlineStatus: settings.onlineStatus,
      friendRequests: settings.friendRequests,
      referralVisibility: settings.referralVisibility,
    };
  }

  async canViewProfile(viewerId: string | null, targetId: string): Promise<boolean> {
    if (!viewerId || viewerId === targetId) return true;

    const settings = await prisma().socialSettings.findUnique({ where: { userId: targetId } });
    const visibility = settings?.profileVisibility ?? DEFAULTS.profileVisibility;

    if (visibility === "PUBLIC") return true;
    if (visibility === "PRIVATE") return false;

    return this.areFriends(viewerId, targetId);
  }

  async canViewActivity(viewerId: string | null, targetId: string): Promise<boolean> {
    if (!viewerId || viewerId === targetId) return true;

    const settings = await prisma().socialSettings.findUnique({ where: { userId: targetId } });
    const visibility = settings?.activityVisibility ?? DEFAULTS.activityVisibility;

    if (visibility === "PUBLIC") return true;
    if (visibility === "PRIVATE") return false;

    return this.areFriends(viewerId, targetId);
  }

  async acceptsFriendRequests(targetId: string): Promise<boolean> {
    const settings = await prisma().socialSettings.findUnique({ where: { userId: targetId } });
    return settings?.friendRequests ?? DEFAULTS.friendRequests;
  }

  async showOnlineStatus(userId: string): Promise<boolean> {
    const settings = await prisma().socialSettings.findUnique({ where: { userId } });
    return settings?.onlineStatus ?? DEFAULTS.onlineStatus;
  }

  private async areFriends(userId: string, friendId: string): Promise<boolean> {
    const friendship = await prisma().friendship.findFirst({
      where: { userId, friendId },
    });
    return Boolean(friendship);
  }
}
