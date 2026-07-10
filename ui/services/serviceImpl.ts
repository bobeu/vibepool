import { prisma } from "@/lib/auth/session";
import { ActivityEngine } from "@/services/engines/ActivityEngine";
import { MissionEngine } from "@/services/engines/MissionEngine";
import { StreakEngine } from "@/services/engines/StreakEngine";
import { NotificationEngine } from "@/services/engines/NotificationEngine";
import { StatisticsEngine } from "@/services/engines/StatisticsEngine";
import { ProgressEngine } from "@/services/engines/ProgressEngine";
import { SpinEngine } from "@/services/engines/SpinEngine";
import { WheelEngine } from "@/services/engines/WheelEngine";
import { RewardClaimEngine } from "@/services/engines/RewardClaimEngine";
import { GamificationEngine } from "@/services/engines/GamificationEngine";
import { eventBus } from "@/services/engines/EventBus";
import type {
  IMissionService,
  IRewardService,
  IActivityService,
  ISpinService,
  INotificationService,
  IProfileService,
  IBlockchainService,
  ISettingsService,
  IProgressionService,
} from "./interfaces";

const activityEngine = new ActivityEngine();
const missionEngine = new MissionEngine();
const streakEngine = new StreakEngine();
const notificationEngine = new NotificationEngine();
const statisticsEngine = new StatisticsEngine();
const progressEngine = new ProgressEngine();
const spinEngine = new SpinEngine();
const wheelEngine = new WheelEngine();
const rewardClaimEngine = new RewardClaimEngine();
const gamificationEngine = new GamificationEngine();

eventBus.subscribe("ActivityRecorded", async (payload) => {
  await progressEngine.handleActivity(payload.userId as string, payload.activityType as string, payload.metadata);
});

eventBus.subscribe("StreakUpdated", async (payload) => {
  await statisticsEngine.increment(payload.userId as string, "LONGEST_STREAK", payload.longestStreak as number);
});

eventBus.subscribe("SpinGranted", async (payload) => {
  await statisticsEngine.increment(payload.userId as string, "SPINS_EARNED", 1);
});

export class MissionService implements IMissionService {
  name = "MissionService";

  async getDailyMissions(wallet: string): Promise<Record<string, unknown>[]> {
    return missionEngine.generateDailyMissions(wallet);
  }

  async completeMission(wallet: string, missionId: string): Promise<Record<string, unknown>> {
    return missionEngine.completeMission(wallet, missionId);
  }

  async getActiveMissions(wallet: string): Promise<Record<string, unknown>[]> {
    return missionEngine.getActiveMissions(wallet);
  }

  async claimMission(wallet: string, missionId: string): Promise<Record<string, unknown>> {
    return missionEngine.claimMission(wallet, missionId);
  }
}

export class RewardService implements IRewardService {
  name = "RewardService";

  async getClaimable(wallet: string): Promise<Record<string, unknown>[]> {
    return rewardClaimEngine.getClaimableRewards(wallet);
  }

  async claimPoints(wallet: string): Promise<Record<string, unknown>> {
    const claimable = await rewardClaimEngine.getClaimableRewards(wallet);
    if (claimable.length === 0) {
      return { claimed: false, message: "No claimable rewards" };
    }
    return rewardClaimEngine.claimReward(wallet, claimable[0].id as string);
  }
}

export class ActivityService implements IActivityService {
  name = "ActivityService";

  async record(wallet: string, type: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>> {
    return activityEngine.record(wallet, type, metadata);
  }

  async getRecent(wallet: string, limit = 20): Promise<Record<string, unknown>[]> {
    return activityEngine.getRecent(wallet, limit);
  }
}

export class SpinService implements ISpinService {
  name = "SpinService";

  async getAvailableSpins(wallet: string): Promise<Record<string, unknown>> {
    return spinEngine.getSpinBalance(wallet);
  }

  async executeSpin(wallet: string): Promise<Record<string, unknown>> {
    const canSpin = await spinEngine.consumeSpin(wallet);
    if (!canSpin) {
      return { success: false, message: "No spins available" };
    }

    const { SecureRandomProvider } = await import("@/services/engines/SecureRandomProvider");
    const randomProvider = new SecureRandomProvider();
    return wheelEngine.generateSpin(wallet, randomProvider);
  }
}

export class NotificationService implements INotificationService {
  name = "NotificationService";

  async getUnread(wallet: string): Promise<Record<string, unknown>[]> {
    return notificationEngine.getUnread(wallet);
  }

  async markRead(id: string): Promise<void> {
    throw new Error("NotificationService.markRead — use POST /api/notifications/read instead");
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
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
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
        currentStreak: 0,
        longestStreak: 0,
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

export class ProgressionService implements IProgressionService {
  name = "ProgressionService";

  async getLevelProgress(wallet: string): Promise<Record<string, unknown>> {
    return gamificationEngine.getLevelProgress(wallet);
  }

  async getPlayerRank(wallet: string): Promise<Record<string, unknown>> {
    return gamificationEngine.getPlayerRank(wallet);
  }

  async getEngagementMetrics(wallet: string): Promise<Record<string, unknown>> {
    return gamificationEngine.getEngagementMetrics(wallet);
  }
}
