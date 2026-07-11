import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IReferralEngine } from "./interfaces";

interface MilestoneReward {
  rewardType: string;
  amount: number;
}

const MILESTONE_REWARDS: Record<string, MilestoneReward> = {
  REGISTERED: { rewardType: "POINTS", amount: 100 },
  FIRST_PREDICTION: { rewardType: "POINTS", amount: 250 },
  FIRST_TOURNAMENT: { rewardType: "SPINS", amount: 2 },
  THIRD_ACTIVE_DAY: { rewardType: "POINTS", amount: 500 },
  FIRST_REWARD: { rewardType: "CELO", amount: 1 },
};

const MILESTONE_ORDER = [
  "REGISTERED",
  "FIRST_PREDICTION",
  "FIRST_TOURNAMENT",
  "THIRD_ACTIVE_DAY",
  "FIRST_REWARD",
];

export class ReferralEngine implements IReferralEngine {
  name = "ReferralEngine";

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

  async getReferrals(wallet: string): Promise<Record<string, unknown>> {
    const referrerId = await this.resolveId(wallet);
    if (!referrerId) return { total: 0, successful: 0, pending: 0, rewards: [] };

    const referrals = await prisma().referral.findMany({
      where: { referrerId },
      include: { rewards: true, referred: { select: { username: true, wallet: true } } },
    });

    const total = referrals.length;
    const successful = referrals.filter((r) => r.status === "COMPLETED").length;
    const pending = referrals.filter((r) => r.status !== "COMPLETED").length;

    const nextMilestone = referrals.length === 0 ? MILESTONE_ORDER[0] : null;

    return {
      total,
      successful,
      pending,
      nextMilestone,
      referrals: referrals.map((r) => ({
        id: r.id,
        wallet: r.referred.wallet,
        username: r.referred.username,
        status: r.status,
        rewardClaimed: r.rewardClaimed,
      })),
    };
  }

  async getRewards(wallet: string): Promise<Record<string, unknown>[]> {
    const referrerId = await this.resolveId(wallet);
    if (!referrerId) return [];

    const referrals = await prisma().referral.findMany({
      where: { referrerId },
      select: { id: true },
    });
    const ids = referrals.map((r) => r.id);
    if (ids.length === 0) return [];

    const rewards = await prisma().referralReward.findMany({
      where: { referralId: { in: ids } },
      orderBy: { createdAt: "desc" },
    });

    return rewards.map((rw) => ({
      id: rw.id,
      milestone: rw.milestone,
      rewardType: rw.rewardType,
      amount: rw.amount,
      claimed: rw.claimed,
      claimedAt: rw.claimedAt,
    }));
  }

  async recordMilestone(referredWallet: string, milestone: string): Promise<Record<string, unknown>[]> {
    const referredId = await this.resolveId(referredWallet);
    if (!referredId) return [];
    return this.recordMilestoneByUserId(referredId, milestone);
  }

  async recordMilestoneByUserId(referredId: string, milestone: string): Promise<Record<string, unknown>[]> {
    const reward = MILESTONE_REWARDS[milestone];
    if (!reward) return [];

    const referral = await prisma().referral.findFirst({
      where: { referredId },
    });
    if (!referral) return [];

    if (referral.fraudStatus === "REVIEW" || referral.fraudStatus === "REJECTED" || referral.fraudStatus === "FLAGGED") {
      logger.warn("Referral milestone blocked by fraud status", { referralId: referral.id, milestone, fraudStatus: referral.fraudStatus });
      return [];
    }

    const created = await prisma().referralReward.upsert({
      where: {
        referralId_milestone: {
          referralId: referral.id,
          milestone: milestone as any,
        },
      },
      update: {},
      create: {
        referralId: referral.id,
        milestone: milestone as any,
        rewardType: reward.rewardType,
        amount: reward.amount,
      },
    });

    eventBus.publish({
      event: "ReferralCompleted",
      userId: referral.referrerId,
      aggregateId: referral.id,
      aggregateType: "Referral",
      milestone,
      rewardType: reward.rewardType,
      amount: reward.amount,
      referredId,
    });

    logger.info("Referral milestone recorded", { referralId: referral.id, milestone });
    return [{ id: created.id, milestone, claimed: created.claimed }];
  }

  async claimReward(wallet: string, rewardId: string): Promise<Record<string, unknown>> {
    const referrerId = await this.resolveId(wallet);
    if (!referrerId) throw new Error("User not found");

    const referral = await prisma().referral.findFirst({
      where: { referrerId, rewards: { some: { id: rewardId } } },
    });
    if (!referral) throw new Error("Reward not found");

    const rw = await prisma().referralReward.findUnique({ where: { id: rewardId } });
    if (!rw || rw.claimed) throw new Error("Reward already claimed");

    await prisma().referralReward.update({
      where: { id: rewardId },
      data: { claimed: true, claimedAt: new Date() },
    });

    await prisma().rewardQueue.create({
      data: {
        userId: referrerId,
        reward: `referral-${rw.milestone.toLowerCase()}`,
        asset: this.assetFor(rw.rewardType),
        amount: rw.amount,
        source: "REFERRAL" as any,
        reason: `Referral milestone: ${rw.milestone}`,
        priority: "NORMAL" as any,
      },
    });

    return { claimed: true, id: rewardId };
  }

  private assetFor(rewardType: string): string {
    switch (rewardType) {
      case "CELO":
        return "0x765DE816845861e75A25fCA122bb6898B8B1282a";
      case "USDM":
        return "0x765DE816845861e75A25fCA122bb6898B8B1282a";
      default:
        return "0x0000000000000000000000000000000000000000";
    }
  }
}
