import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type {
  IMissionService,
  IRewardService,
  IActivityService,
  ISpinService,
  INotificationService,
  IProfileService,
  IBlockchainService,
  ISettingsService,
} from "./interfaces";

export class MissionService implements IMissionService {
  name = "MissionService";

  async getDailyMissions(_wallet: string): Promise<Record<string, unknown>[]> {
    throw new Error("MissionService.getDailyMissions — Prompt 5");
  }

  async completeMission(_wallet: string, _missionId: string): Promise<Record<string, unknown>> {
    throw new Error("MissionService.completeMission — Prompt 5");
  }
}

export class RewardService implements IRewardService {
  name = "RewardService";

  async getClaimable(_wallet: string): Promise<Record<string, unknown>[]> {
    throw new Error("RewardService.getClaimable — Prompt 5");
  }

  async claimPoints(_wallet: string): Promise<Record<string, unknown>> {
    throw new Error("RewardService.claimPoints — Prompt 5");
  }
}

export class ActivityService implements IActivityService {
  name = "ActivityService";

  async record(wallet: string, type: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const activity = await prisma().activity.create({
      data: {
        userId: wallet,
        type: type as any,
        metadata,
      },
    });

    logger.info("Activity recorded", { wallet, type });
    return { id: activity.id };
  }

  async getRecent(wallet: string, limit = 20): Promise<Record<string, unknown>[]> {
    const activities = await prisma().activity.findMany({
      where: { userId: wallet },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      metadata: a.metadata,
      createdAt: a.createdAt,
    }));
  }
}

export class SpinService implements ISpinService {
  name = "SpinService";

  async getAvailableSpins(_wallet: string): Promise<Record<string, unknown>> {
    throw new Error("SpinService.getAvailableSpins — Prompt 5");
  }

  async executeSpin(_wallet: string): Promise<Record<string, unknown>> {
    throw new Error("SpinService.executeSpin — Prompt 5");
  }
}

export class NotificationService implements INotificationService {
  name = "NotificationService";

  async getUnread(_wallet: string): Promise<Record<string, unknown>[]> {
    throw new Error("NotificationService.getUnread — Prompt 5");
  }

  async markRead(_id: string): Promise<void> {
    throw new Error("NotificationService.markRead — Prompt 5");
  }
}

export class ProfileService implements IProfileService {
  name = "ProfileService";

  async getByWallet(wallet: string): Promise<Record<string, unknown> | null> {
    const profile = await prisma().userProfile.findUnique({
      where: { wallet },
    });

    if (!profile) return null;

    return {
      wallet: profile.wallet,
      username: profile.username,
      avatar: profile.avatar,
      xp: profile.xp,
      points: profile.points,
      spins: profile.spins,
      level: profile.level,
      currentRank: profile.currentRank,
      lastLogin: profile.lastLogin,
      totalActivity: profile.totalActivity,
      status: profile.status,
    };
  }

  async upsert(wallet: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const profile = await prisma().userProfile.upsert({
      where: { wallet },
      update: {
        username: (data.username as string) || undefined,
        avatar: (data.avatar as string) || undefined,
      },
      create: {
        wallet,
        username: (data.username as string) || null,
        avatar: (data.avatar as string) || null,
        xp: 0,
        points: 0,
        spins: 0,
        level: 0,
        totalActivity: 0,
        status: "ACTIVE",
      },
    });

    return {
      wallet: profile.wallet,
      username: profile.username,
      avatar: profile.avatar,
      xp: profile.xp,
      points: profile.points,
      spins: profile.spins,
      level: profile.level,
      currentRank: profile.currentRank,
    };
  }
}

export class BlockchainService implements IBlockchainService {
  name = "BlockchainService";

  async readProfile(_wallet: string): Promise<Record<string, unknown> | null> {
    throw new Error("BlockchainService.readProfile — Prompt 5");
  }

  async readTreasury(): Promise<Record<string, unknown> | null> {
    throw new Error("BlockchainService.readTreasury — Prompt 5");
  }

  async submitBackendTransaction(_tx: Record<string, unknown>): Promise<string> {
    throw new Error("BlockchainService.submitBackendTransaction — Prompt 5");
  }

  async listenToEvents(): Promise<void> {
    throw new Error("BlockchainService.listenToEvents — Prompt 5");
  }

  async syncLocalCache(): Promise<void> {
    throw new Error("BlockchainService.syncLocalCache — Prompt 5");
  }

  async retryFailedTransaction(_txHash: string): Promise<string> {
    throw new Error("BlockchainService.retryFailedTransaction — Prompt 5");
  }
}

export class SettingsService implements ISettingsService {
  name = "SettingsService";

  async get(_key: string): Promise<string | null> {
    const setting = await prisma().settings.findUnique({
      where: { key: _key },
    });

    return setting?.value ?? null;
  }

  async set(_key: string, _value: string): Promise<void> {
    await prisma().settings.upsert({
      where: { key: _key },
      update: { value: _value },
      create: { key: _key, value: _value },
    });
  }

  async getAll(): Promise<Record<string, string>> {
    const all = await prisma().settings.findMany();
    return Object.fromEntries(all.map((s) => [s.key, s.value]));
  }
}
