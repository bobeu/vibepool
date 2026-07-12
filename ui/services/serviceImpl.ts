import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
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
import { FriendEngine } from "@/services/engines/FriendEngine";
import { ReferralEngine } from "@/services/engines/ReferralEngine";
import { CommunityEngine } from "@/services/engines/CommunityEngine";
import { PresenceEngine } from "@/services/engines/PresenceEngine";
import { FeedEngine } from "@/services/engines/FeedEngine";
import { InviteEngine } from "@/services/engines/InviteEngine";
import { UnlockAnimationEngine } from "@/services/engines/UnlockAnimationEngine";
import { SocialSettingsEngine } from "@/services/engines/SocialSettingsEngine";
import { ArenaEngine } from "@/services/engines/ArenaEngine";
import { MatchmakingEngine } from "@/services/engines/MatchmakingEngine";
import { MatchEngine } from "@/services/engines/MatchEngine";
import { ResultEngine } from "@/services/engines/ResultEngine";
import { SpectatorEngine } from "@/services/engines/SpectatorEngine";
import { SeasonEngine } from "@/services/engines/SeasonEngine";
import { ContentEngine } from "@/services/engines/ContentEngine";
import { FeatureFlagEngine } from "@/services/engines/FeatureFlagEngine";
import { LiveOpsEngine } from "@/services/engines/LiveOpsEngine";
import { CampaignEngine } from "@/services/engines/CampaignEngine";
import { eventBus } from "@/services/engines/EventBus";
import { getSchedulerEngine } from "@/services/schedulerRegistry";
import { isRuntimeEnabled } from "@/lib/runtime/productionConfig";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { getBlockchainSyncService } from "@/lib/blockchain/client";
import { trackBetaEvent, trackRetentionOnLogin } from "@/lib/telemetry/betaEvents";
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
const friendEngine = new FriendEngine();
const referralEngine = new ReferralEngine();
const communityEngine = new CommunityEngine();
const presenceEngine = new PresenceEngine();
const feedEngine = new FeedEngine();
const inviteEngine = new InviteEngine();
const unlockAnimationEngine = new UnlockAnimationEngine();
const socialSettingsEngine = new SocialSettingsEngine();
const arenaEngine = new ArenaEngine();
const matchmakingEngine = new MatchmakingEngine();
const matchEngine = new MatchEngine();
const resultEngine = new ResultEngine();
const spectatorEngine = new SpectatorEngine();
const seasonEngine = new SeasonEngine();
const contentEngine = new ContentEngine();
const featureFlagEngine = new FeatureFlagEngine();
const liveOpsEngine = new LiveOpsEngine();
const schedulerEngine = getSchedulerEngine();
const campaignEngine = new CampaignEngine();

// Scheduler handlers registered in schedulerRegistry.ts

eventBus.subscribe("ActivityRecorded", async (payload) => {
  const userId = payload.userId as string;
  const activityType = payload.activityType as string;
  const wallet = payload.wallet as string | undefined;

  await progressEngine.handleActivity(userId, activityType, payload.metadata);

  if (activityType === "PREDICTION") {
    await trackBetaEvent(userId, "first_prediction");
    if (wallet) await referralEngine.recordMilestone(wallet, "FIRST_PREDICTION");
  }
  if (activityType === "TOURNAMENT" && wallet) {
    await referralEngine.recordMilestone(wallet, "FIRST_TOURNAMENT");
  }
  if (activityType === "REWARD" && wallet) {
    await referralEngine.recordMilestone(wallet, "FIRST_REWARD");
  }
  if (activityType === "ARENA") {
    await trackBetaEvent(userId, "first_arena_match");
  }
  if (activityType === "LOGIN") {
    await trackRetentionOnLogin(userId);
    if (wallet) {
      const stats = await prisma().playerStatistic.findUnique({
        where: { userId_type: { userId, type: "LOGIN_DAYS" } },
      });
      if ((stats?.value ?? 0) >= 3) {
        await referralEngine.recordMilestone(wallet, "THIRD_ACTIVE_DAY");
      }
    }
  }
});

eventBus.subscribe("StreakUpdated", async (payload) => {
  await statisticsEngine.increment(payload.userId as string, "LONGEST_STREAK", payload.longestStreak as number);
});

eventBus.subscribe("SpinGranted", async (payload) => {
  await statisticsEngine.increment(payload.userId as string, "SPINS_EARNED", 1);
});

async function publishFeed(data: Record<string, unknown>): Promise<void> {
  try {
    await feedEngine.publish(data);
  } catch (error) {
    logger.error("Feed publish failed", { error: String(error) });
  }
}

eventBus.subscribe("FriendRequestSent", async (payload) => {
  await notificationEngine.send(
    payload.receiverId as string,
    "INFO",
    "New friend request",
    "You have a new friend request.",
    "NORMAL"
  );
  await publishFeed({
    userId: payload.receiverId as string,
    actorId: payload.userId as string,
    type: "FRIEND_REQUEST",
    title: "New friend request",
    body: "You have a new friend request.",
    visibility: "FRIENDS",
  });
});

eventBus.subscribe("FriendAccepted", async (payload) => {
  await notificationEngine.send(
    payload.friendId as string,
    "INFO",
    "Friend request accepted",
    "You are now friends!",
    "NORMAL"
  );
  await publishFeed({
    userId: payload.friendId as string,
    actorId: payload.userId as string,
    type: "FRIEND_REQUEST",
    title: "You are now friends",
    body: "A new friendship has begun.",
    visibility: "FRIENDS",
  });
  await feedEngine.publishForFriends(payload.userId as string, {
    type: "FRIEND_REQUEST",
    title: "New friend joined your circle",
    body: "A player accepted your friend request.",
  });
});

eventBus.subscribe("ReferralCompleted", async (payload) => {
  await notificationEngine.send(
    payload.userId as string,
    "REWARD",
    "Referral reward unlocked",
    `${payload.milestone} milestone reached.`,
    "HIGH"
  );
  await publishFeed({
    userId: payload.userId as string,
    type: "REFERRAL",
    title: "Referral reward unlocked",
    body: `${payload.milestone} milestone reached.`,
    referenceType: "Referral",
    referenceId: payload.aggregateId as string,
    visibility: "PRIVATE",
  });
});

eventBus.subscribe("ReferralRegistered", async (payload) => {
  await referralEngine.recordMilestoneByUserId(payload.referredId as string, "REGISTERED");
  await trackBetaEvent(payload.userId as string, "first_referral", { referredId: payload.referredId });
  await notificationEngine.send(
    payload.userId as string,
    "INFO",
    "Referral success",
    "A new player joined using your invite.",
    "NORMAL"
  );
});

// TODO(Prompt15-DORMANT): Presence feed side effects disabled at launch — re-enable via PRODUCTION_RUNTIME.enablePresenceFeedSideEffects
if (isRuntimeEnabled("enablePresenceFeedSideEffects")) {
  eventBus.subscribe("PresenceChanged", async () => {
    // Optional presence feed updates
  });
}

eventBus.subscribe("AchievementUnlocked", async (payload) => {
  const userId = payload.userId as string;
  await unlockAnimationEngine.enqueue(
    userId,
    "ACHIEVEMENT",
    payload.achievementId as string,
    { title: payload.title, category: payload.category },
    payload.rarity as string | undefined
  );
  await notificationEngine.send(
    userId,
    "REWARD",
    "Achievement unlocked",
    (payload.title as string) ?? "You unlocked an achievement.",
    payload.rarity === "LEGENDARY" ? "URGENT" : "HIGH"
  );
  await publishFeed({
    userId,
    type: "ACHIEVEMENT",
    title: (payload.title as string) ?? "Achievement unlocked",
    body: "An achievement was unlocked.",
    referenceType: "Achievement",
    referenceId: payload.achievementId as string,
    visibility: "FRIENDS",
  });
  await feedEngine.publishForFriends(userId, {
    type: "ACHIEVEMENT",
    title: (payload.title as string) ?? "Friend unlocked an achievement",
    body: "A friend reached a new milestone.",
    referenceType: "Achievement",
    referenceId: payload.achievementId as string,
  });
});

eventBus.subscribe("CommunityAnnouncement", async (payload) => {
  await notificationEngine.send(
    payload.userId as string,
    "SYSTEM",
    (payload.title as string) ?? "Community announcement",
    (payload.body as string) ?? "",
    "NORMAL"
  );
});

eventBus.subscribe("BadgeEquipped", async (payload) => {
  await publishFeed({
    userId: payload.userId as string,
    type: "BADGE",
    title: "New badge equipped",
    body: (payload.badge as string) ?? "Badge",
    referenceType: "Badge",
  });
});

eventBus.subscribe("TitleEquipped", async (payload) => {
  await publishFeed({
    userId: payload.userId as string,
    type: "BADGE",
    title: "New title equipped",
    body: (payload.title as string) ?? "Title",
    referenceType: "Title",
  });
});

eventBus.subscribe("ArenaMatchFound", async (payload) => {
  const playerIds = (payload.playerIds as string[]) ?? [];
  for (const userId of playerIds) {
    await notificationEngine.send(userId, "INFO", "Arena match found", "Accept your match to begin.", "HIGH");
    await arenaEngine.setArenaPresence(
      (await prisma().userProfile.findUnique({ where: { id: userId }, select: { wallet: true } }))?.wallet ?? "",
      "MATCHED",
      payload.aggregateId as string
    );
  }
});

eventBus.subscribe("ArenaInvitationSent", async (payload) => {
  await notificationEngine.send(
    payload.receiverId as string,
    "INFO",
    "Arena challenge",
    "A friend challenged you to a duel.",
    "HIGH"
  );
});

eventBus.subscribe("ArenaMatchCompleted", async (payload) => {
  const playerIds = (payload.playerIds as string[]) ?? [];
  const winnerId = payload.winnerId as string | null;
  const isDraw = Boolean(payload.isDraw);

  for (const userId of playerIds) {
    const user = await prisma().userProfile.findUnique({ where: { id: userId }, select: { wallet: true } });
    if (!user) continue;

    const won = !isDraw && userId === winnerId;
    await arenaEngine.setArenaPresence(user.wallet, "OFFLINE");

    if (won) {
      await seasonEngine.addSeasonXp(userId, 50);
    } else if (!isDraw) {
      await seasonEngine.addSeasonXp(userId, 15);
    }

    await unlockAnimationEngine.enqueue(
      userId,
      won ? "ARENA_VICTORY" : isDraw ? "ARENA_DRAW" : "ARENA_DEFEAT",
      payload.aggregateId as string,
      { matchId: payload.aggregateId }
    );

    await activityEngine.record(user.wallet, "SOCIAL", {
      kind: "ARENA_MATCH",
      matchId: payload.aggregateId,
      won,
      isDraw,
    });

    await statisticsEngine.increment(userId, won ? "ARENA_WINS" : "ARENA_MATCHES", 1);

    await publishFeed({
      userId,
      type: won ? "ARENA_VICTORY" : "ARENA_MATCH",
      title: won ? "Arena victory" : isDraw ? "Arena draw" : "Arena match completed",
      body: won ? "You won a head-to-head duel." : isDraw ? "The duel ended in a draw." : "Better luck next time.",
      referenceType: "ArenaMatch",
      referenceId: payload.aggregateId as string,
      priority: won ? "HIGH" : "NORMAL",
      pinned: won,
      visibility: "FRIENDS",
    });

    if (won) {
      await feedEngine.publishForFriends(userId, {
        type: "ARENA_VICTORY",
        title: "Friend won an arena duel",
        body: "A friend claimed victory in NEXORA Arena.",
        referenceType: "ArenaMatch",
        referenceId: payload.aggregateId as string,
        priority: "HIGH",
      });

      await referralEngine.recordMilestoneByUserId(userId, "FIRST_TOURNAMENT");
    }
  }
});

eventBus.subscribe("ArenaRewardEligible", async (payload) => {
  const userId = payload.userId as string;
  const xp = payload.xp as number;
  if (xp > 0) {
    await prisma().userProfile.update({
      where: { id: userId },
      data: { xp: { increment: xp } },
    });
  }
  const points = payload.points as number;
  if (points > 0) {
    await prisma().userProfile.update({
      where: { id: userId },
      data: { points: { increment: points } },
    });
  }
});

eventBus.subscribe("ArenaQueueJoined", async (payload) => {
  const userId = payload.userId as string;
  const user = await prisma().userProfile.findUnique({ where: { id: userId }, select: { wallet: true } });
  if (user) await arenaEngine.setArenaPresence(user.wallet, "SEARCHING");
});

eventBus.subscribe("ArenaMatchStarted", async (payload) => {
  const match = await prisma().arenaMatch.findUnique({
    where: { id: payload.aggregateId as string },
    include: { participants: true },
  });
  if (!match) return;
  for (const p of match.participants) {
    const user = await prisma().userProfile.findUnique({ where: { id: p.userId }, select: { wallet: true } });
    if (user) await arenaEngine.setArenaPresence(user.wallet, "PLAYING", match.id);
  }
});

eventBus.subscribe("ReferralFlagged", async (payload) => {
  await notificationEngine.send(
    payload.userId as string,
    "SYSTEM",
    "Referral under review",
    "A referral was flagged for manual review.",
    "NORMAL"
  );
});

eventBus.subscribe("SeasonStarted", async (payload) => {
  await publishFeed({
    type: "SEASON",
    title: (payload.name as string) ?? "New season",
    body: "Season progression has reset — climb the ranks again.",
    visibility: "PUBLIC",
  });
});

eventBus.subscribe("SeasonEnded", async (payload) => {
  await publishFeed({
    type: "SEASON",
    title: "Season ended",
    body: `Season ${payload.seasonNumber} has concluded.`,
    visibility: "PUBLIC",
  });
});

eventBus.subscribe("FeatureFlagChanged", async (payload) => {
  logger.info("Feature flag changed", { key: payload.key, enabled: payload.enabled });
});

eventBus.subscribe("CampaignStarted", async (payload) => {
  await publishFeed({
    type: "CAMPAIGN",
    title: (payload.name as string) ?? "Campaign started",
    body: "A new live campaign is active.",
    visibility: "PUBLIC",
  });
});

eventBus.subscribe("CampaignCompleted", async (payload) => {
  logger.info("Campaign completed", { name: payload.name });
});

eventBus.subscribe("BannerPublished", async (payload) => {
  await publishFeed({
    type: "ANNOUNCEMENT",
    title: (payload.title as string) ?? "New banner",
    body: "Check the home page for the latest promotion.",
    visibility: "PUBLIC",
  });
});

eventBus.subscribe("LiveEventStarted", async (payload) => {
  await publishFeed({
    type: "EVENT",
    title: (payload.name as string) ?? "Live event",
    body: "Join the event center for details.",
    visibility: "PUBLIC",
  });
});

eventBus.subscribe("LiveEventEnded", async () => {
  logger.info("Live events ended batch");
});

eventBus.subscribe("MissionCompleted", async (payload) => {
  const userId = payload.userId as string;
  await notificationEngine.send(userId, "REWARD", "Mission complete", "Claim your mission reward.", "NORMAL");
});

eventBus.subscribe("RewardClaimed", async (payload) => {
  const userId = payload.userId as string;
  await trackBetaEvent(userId, "first_reward_claim", { rewardId: payload.rewardId });
  await notificationEngine.send(userId, "REWARD", "Reward claimed", "Your reward has been added.", "HIGH");
});

eventBus.subscribe("SpinCompleted", async (payload) => {
  const userId = payload.userId as string;
  await trackBetaEvent(userId, "first_spin", { reward: payload.reward });
});

eventBus.subscribe("RewardSettled", async (payload) => {
  const userId = payload.userId as string;
  await notificationEngine.send(
    userId,
    "REWARD",
    "Reward settled",
    payload.onChain ? "Your on-chain reward was confirmed." : "Your reward has been processed.",
    "HIGH"
  );
});

eventBus.subscribe("RewardSettlementFailed", async (payload) => {
  const userId = payload.userId as string;
  await notificationEngine.send(
    userId,
    "ERROR",
    "Settlement delayed",
    "We are retrying your reward. No action needed.",
    "HIGH"
  );
});

export class MissionService implements IMissionService {
  name = "MissionService";

  async getDailyMissions(wallet: string): Promise<Record<string, unknown>[]> {
    const userId = await resolveUserId(wallet);
    return missionEngine.generateDailyMissions(userId);
  }

  async completeMission(wallet: string, missionId: string): Promise<Record<string, unknown>> {
    const userId = await resolveUserId(wallet);
    return missionEngine.completeMission(userId, missionId);
  }

  async getActiveMissions(wallet: string): Promise<Record<string, unknown>[]> {
    const userId = await resolveUserId(wallet);
    await missionEngine.generateDailyMissions(userId);
    return missionEngine.getActiveMissions(userId);
  }

  async claimMission(wallet: string, missionId: string): Promise<Record<string, unknown>> {
    const userId = await resolveUserId(wallet);
    return missionEngine.claimMission(userId, missionId);
  }
}

export class RewardService implements IRewardService {
  name = "RewardService";

  async getClaimable(wallet: string): Promise<Record<string, unknown>[]> {
    const userId = await resolveUserId(wallet);
    return rewardClaimEngine.getClaimableRewards(userId);
  }

  async claimPoints(wallet: string): Promise<Record<string, unknown>> {
    const userId = await resolveUserId(wallet);
    const claimable = await rewardClaimEngine.getClaimableRewards(userId);
    if (claimable.length === 0) {
      return { claimed: false, message: "No claimable rewards" };
    }
    return rewardClaimEngine.claimReward(userId, claimable[0].id as string);
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
    const userId = await resolveUserId(wallet);
    return spinEngine.getSpinBalance(userId);
  }

  async executeSpin(wallet: string): Promise<Record<string, unknown>> {
    const userId = await resolveUserId(wallet);
    const canSpin = await spinEngine.consumeSpin(userId);
    if (!canSpin) {
      return { success: false, message: "No spins available" };
    }

    const { SecureRandomProvider } = await import("@/services/engines/SecureRandomProvider");
    const randomProvider = new SecureRandomProvider();
    return wheelEngine.generateSpin(userId, randomProvider);
  }
}

export class NotificationService implements INotificationService {
  name = "NotificationService";

  async getUnread(wallet: string): Promise<Record<string, unknown>[]> {
    const userId = await resolveUserId(wallet);
    return notificationEngine.getUnread(userId);
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
  private sync = getBlockchainSyncService();

  async readProfile(wallet: string): Promise<Record<string, unknown> | null> {
    if (isRuntimeEnabled("enableBlockchainServiceStub")) {
      throw new Error("BlockchainService.readProfile — stub mode");
    }
    return this.sync.readProfile(wallet);
  }

  async readTreasury(): Promise<Record<string, unknown> | null> {
    if (isRuntimeEnabled("enableBlockchainServiceStub")) {
      throw new Error("BlockchainService.readTreasury — stub mode");
    }
    return this.sync.readTreasury();
  }

  async submitBackendTransaction(tx: Record<string, unknown>): Promise<string> {
    if (isRuntimeEnabled("enableBlockchainServiceStub")) {
      throw new Error("BlockchainService.submitBackendTransaction — stub mode");
    }
    return this.sync.submitBackendTransaction(tx);
  }

  async listenToEvents(): Promise<void> {
    return this.sync.listenToEvents();
  }

  async syncLocalCache(): Promise<void> {
    return this.sync.syncLocalCache();
  }

  async retryFailedTransaction(txHash: string): Promise<string> {
    return this.sync.retryFailedTransaction(txHash);
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
    const userId = await resolveUserId(wallet);
    return gamificationEngine.getLevelProgress(userId);
  }

  async getPlayerRank(wallet: string): Promise<Record<string, unknown>> {
    const userId = await resolveUserId(wallet);
    return gamificationEngine.getPlayerRank(userId);
  }

  async getEngagementMetrics(wallet: string): Promise<Record<string, unknown>> {
    const userId = await resolveUserId(wallet);
    return gamificationEngine.getEngagementMetrics(userId);
  }
}

export class FriendService {
  name = "FriendService";

  async getFriends(wallet: string) {
    return friendEngine.getFriends(wallet);
  }

  async getPending(wallet: string) {
    return friendEngine.getPending(wallet);
  }

  async sendRequest(wallet: string, receiverWallet: string, message?: string) {
    return friendEngine.sendRequest(wallet, receiverWallet, message);
  }

  async respond(wallet: string, requestId: string, accept: boolean) {
    return friendEngine.respond(wallet, requestId, accept);
  }

  async removeFriend(wallet: string, friendWallet: string) {
    return friendEngine.removeFriend(wallet, friendWallet);
  }

  async block(wallet: string, targetWallet: string) {
    return friendEngine.block(wallet, targetWallet);
  }

  async unblock(wallet: string, targetWallet: string) {
    return friendEngine.unblock(wallet, targetWallet);
  }
}

export class ReferralService {
  name = "ReferralService";

  async getReferrals(wallet: string) {
    return referralEngine.getReferrals(wallet);
  }

  async getRewards(wallet: string) {
    return referralEngine.getRewards(wallet);
  }

  async recordMilestone(referredWallet: string, milestone: string) {
    return referralEngine.recordMilestone(referredWallet, milestone);
  }

  async claimReward(wallet: string, rewardId: string) {
    return referralEngine.claimReward(wallet, rewardId);
  }
}

export class CommunityService {
  name = "CommunityService";

  async getPosts(limit = 20) {
    return communityEngine.getPosts(limit);
  }

  async createPost(authorWallet: string, data: Record<string, unknown>) {
    return communityEngine.createPost(authorWallet, data);
  }
}

export class PresenceService {
  name = "PresenceService";

  async setPresence(wallet: string, status: string, options?: { deviceId?: string; deviceType?: string }) {
    return presenceEngine.setPresence(wallet, status, options);
  }

  async getPresence(wallet: string) {
    return presenceEngine.getPresence(wallet);
  }

  async getFriendsPresence(wallet: string) {
    return presenceEngine.getFriendsPresence(wallet);
  }
}

export class FeedService {
  name = "FeedService";

  async getFeed(wallet: string, limit = 30) {
    return feedEngine.getFeed(wallet, limit);
  }

  async publish(data: Record<string, unknown>) {
    return feedEngine.publish(data);
  }
}

export class InviteService {
  name = "InviteService";

  async generate(wallet: string, type: string) {
    return inviteEngine.generate(wallet, type);
  }

  async getInvites(wallet: string) {
    return inviteEngine.getInvites(wallet);
  }

  async redeem(code: string, referredWallet: string, context?: Record<string, unknown>) {
    return inviteEngine.redeem(code, referredWallet, context);
  }
}

export class SocialSettingsService {
  name = "SocialSettingsService";

  async getSettings(wallet: string) {
    return socialSettingsEngine.getSettings(wallet);
  }

  async updateSettings(wallet: string, data: Record<string, unknown>) {
    return socialSettingsEngine.updateSettings(wallet, data);
  }
}

export class UnlockAnimationService {
  name = "UnlockAnimationService";

  async getPending(wallet: string) {
    const user = await prisma().userProfile.findUnique({ where: { wallet }, select: { id: true } });
    if (!user) return [];
    return unlockAnimationEngine.getPending(user.id);
  }

  async markViewed(wallet: string, animationId: string) {
    const user = await prisma().userProfile.findUnique({ where: { wallet }, select: { id: true } });
    if (!user) throw new Error("User not found");
    await unlockAnimationEngine.markViewed(user.id, animationId);
    return { viewed: true };
  }
}

export class ArenaService {
  name = "ArenaService";

  async getHome(wallet: string) {
    return arenaEngine.getHome(wallet);
  }

  async getRating(wallet: string) {
    return arenaEngine.getRating(wallet);
  }

  async getHistory(wallet: string, limit = 20) {
    return arenaEngine.getHistory(wallet, limit);
  }

  async getReplay(wallet: string, matchId: string) {
    return arenaEngine.getReplay(wallet, matchId);
  }

  async joinQueue(wallet: string, mode: string, matchType?: string, options?: Record<string, unknown>) {
    return matchmakingEngine.joinQueue(wallet, mode, matchType, options);
  }

  async cancelQueue(wallet: string) {
    return matchmakingEngine.cancelQueue(wallet);
  }

  async getQueueStatus(wallet: string) {
    return matchmakingEngine.getQueueStatus(wallet);
  }

  async acceptMatch(wallet: string, matchId: string) {
    return matchEngine.acceptMatch(wallet, matchId);
  }

  async declineMatch(wallet: string, matchId: string) {
    return matchEngine.declineMatch(wallet, matchId);
  }

  async getMatch(wallet: string, matchId: string) {
    return matchEngine.getMatch(wallet, matchId);
  }

  async submitPrediction(wallet: string, matchId: string, prediction: number) {
    return matchEngine.submitPrediction(wallet, matchId, prediction);
  }

  async createInvite(wallet: string, friendWallet: string) {
    return arenaEngine.createInvite(wallet, friendWallet);
  }

  async joinByInviteCode(wallet: string, inviteCode: string) {
    return matchmakingEngine.joinByInviteCode(wallet, inviteCode);
  }

  async createRematch(wallet: string, previousMatchId: string) {
    return matchmakingEngine.createRematch(wallet, previousMatchId);
  }

  async watchMatch(matchId: string) {
    return spectatorEngine.watchMatch(matchId);
  }

  async getLiveMatches(limit = 20) {
    return spectatorEngine.getLiveMatches(limit);
  }
}

export class SeasonService {
  name = "SeasonService";

  async getActiveSeason() {
    return seasonEngine.getActiveSeason();
  }

  async listSeasons() {
    return seasonEngine.listSeasons();
  }

  async getProgress(wallet: string) {
    return seasonEngine.getProgress(wallet);
  }

  async createSeason(wallet: string, data: Record<string, unknown>) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "seasons:write");
    return seasonEngine.createSeason(data);
  }

  async activateSeason(wallet: string, seasonId: string) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "seasons:write");
    return seasonEngine.activateSeason(seasonId);
  }
}

export class LiveOpsService {
  name = "LiveOpsService";

  async getDashboard(wallet: string) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "seasons:read");
    return liveOpsEngine.getDashboard();
  }

  async listEvents(limit = 20) {
    return liveOpsEngine.listEvents(limit);
  }

  async createEvent(wallet: string, data: Record<string, unknown>) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "events:write");
    return liveOpsEngine.createEvent(data);
  }

  async getBanners(placement?: string, wallet?: string) {
    return liveOpsEngine.getBanners(placement, wallet);
  }

  async publishBanner(wallet: string, data: Record<string, unknown>) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "banners:write");
    return liveOpsEngine.publishBanner(data);
  }

  async dismissBanner(wallet: string, bannerId: string) {
    return liveOpsEngine.dismissBanner(wallet, bannerId);
  }
}

export class FeatureFlagService {
  name = "FeatureFlagService";

  async listFlags(wallet?: string) {
    if (wallet) {
      const { requireAdmin } = await import("@/lib/admin/auth");
      await requireAdmin(wallet, "flags:read");
    }
    return featureFlagEngine.listFlags();
  }

  async isEnabled(key: string, context?: Record<string, unknown>) {
    return featureFlagEngine.isEnabled(key, context);
  }

  async upsertFlag(wallet: string, data: Record<string, unknown>) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "flags:write");
    return featureFlagEngine.upsertFlag(data);
  }
}

export class ContentService {
  name = "ContentService";

  async getBlocks(placement?: string, locale?: string) {
    return contentEngine.getBlocks(placement, locale);
  }

  async getHeroBanner(wallet?: string) {
    return contentEngine.getHeroBanner(wallet);
  }

  async createBlock(wallet: string, data: Record<string, unknown>) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "content:write");
    return contentEngine.createBlock(data);
  }
}

export class CampaignService {
  name = "CampaignService";

  async listCampaigns(status?: string) {
    return campaignEngine.listCampaigns(status);
  }

  async createCampaign(wallet: string, data: Record<string, unknown>) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "campaigns:write");
    return campaignEngine.createCampaign(data);
  }

  async startCampaign(wallet: string, campaignId: string) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "campaigns:write");
    return campaignEngine.startCampaign(campaignId);
  }
}

export class SchedulerService {
  name = "SchedulerService";

  async runDueJobs(wallet: string, limit = 20) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "scheduler:execute");
    return schedulerEngine.runDueJobs(limit);
  }

  async schedule(wallet: string, jobType: string, scheduledAt: Date, payload?: Record<string, unknown>, options?: Record<string, unknown>) {
    const { requireAdmin } = await import("@/lib/admin/auth");
    await requireAdmin(wallet, "scheduler:execute");
    return schedulerEngine.schedule(jobType, scheduledAt, payload, {
      idempotencyKey: options?.idempotencyKey as string | undefined,
      dependsOnJobIds: options?.dependsOnJobIds as string[] | undefined,
      dryRun: Boolean(options?.dryRun),
    });
  }
}
