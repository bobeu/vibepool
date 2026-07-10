import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import { XPRewardEngine } from "./XPRewardEngine";
import { SettingsService } from "../serviceImpl";
import type { IRewardClaimEngine } from "./interfaces";

export class RewardClaimEngine implements IRewardClaimEngine {
  name = "RewardClaimEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async claimReward(userId: string, rewardId: string): Promise<Record<string, unknown>> {
    const reward = await prisma().rewardQueue.findFirst({
      where: { id: rewardId, userId, status: "PENDING" },
    });

    if (!reward) {
      return { claimed: false, message: "Reward not found or already claimed" };
    }

    await prisma().$transaction(async (tx) => {
      await tx.rewardQueue.update({
        where: { id: rewardId },
        data: { status: "PROCESSING", processedAt: new Date() },
      });

      if (reward.source === "SPIN") {
        const xpEngine = new XPRewardEngine();
        const settingsService = new SettingsService();
        const settings = await settingsService.getAll();
        const xp = xpEngine.calculateXP(settings, { participation: true });

        await tx.userProfile.update({
          where: { id: userId },
          data: { xp: { increment: xp } },
        });
      }

      await tx.rewardClaim.create({
        data: {
          userId,
          reward: reward.reward,
          asset: reward.asset,
          amount: reward.amount,
          reason: reward.reason,
          status: "PROCESSING",
        },
      });

      await tx.rewardQueue.update({
        where: { id: rewardId },
        data: { status: "PAID", processedAt: new Date() },
      });
    });

    eventBus.publish({
      event: "RewardClaimed",
      userId,
      rewardId,
      reward: reward.reward,
      asset: reward.asset,
      amount: reward.amount,
    });

    logger.info("Reward claimed", { userId, rewardId });
    return { claimed: true, rewardId };
  }

  async getClaimableRewards(userId: string): Promise<Record<string, unknown>[]> {
    const rewards = await prisma().rewardQueue.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    return rewards.map((r) => ({
      id: r.id,
      userId: r.userId,
      reward: r.reward,
      asset: r.asset,
      amount: r.amount,
      source: r.source,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }
}
