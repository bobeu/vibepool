import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import { submitTreasuryPayout, isBlockchainSettlementEnabled } from "@/lib/blockchain/client";
import type { ISettlementEngine } from "./interfaces";

const MAX_RETRIES = 3;
const BACKOFF_BASE = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SettlementEngine implements ISettlementEngine {
  name = "SettlementEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async settleReward(rewardId: string): Promise<Record<string, unknown>> {
    const pendingReward = await prisma().pendingReward.findUnique({
      where: { id: rewardId },
      include: { user: { select: { wallet: true } } },
    });

    if (!pendingReward) {
      throw new Error("Pending reward not found");
    }

    if (pendingReward.status === "PAID") {
      return { id: pendingReward.id, status: "PAID", transactionHash: pendingReward.transactionHash };
    }

    await prisma().pendingReward.update({
      where: { id: rewardId },
      data: { status: "PROCESSING", txAttempts: { increment: 1 } },
    });

    const startedAt = Date.now();

    try {
      const txHash = await this.submitBlockchainTransaction(pendingReward);

      await prisma().$transaction(async (tx) => {
        await tx.pendingReward.update({
          where: { id: rewardId },
          data: { status: "PAID", transactionHash: txHash, lastError: null },
        });

        await tx.rewardLedger.create({
          data: {
            userId: pendingReward.userId,
            reward: pendingReward.reward,
            asset: pendingReward.asset,
            amount: pendingReward.amount,
            reason: pendingReward.reason,
            transactionHash: txHash,
            treasuryRequestId: pendingReward.treasuryRequestId ?? rewardId,
          },
        });
      });

      eventBus.publish({
        event: "RewardSettled",
        userId: pendingReward.userId,
        rewardId,
        transactionHash: txHash,
        durationMs: Date.now() - startedAt,
        onChain: isBlockchainSettlementEnabled(),
      });

      logger.info("Reward settled", { rewardId, txHash });
      return { id: rewardId, status: "PAID", transactionHash: txHash };
    } catch (error) {
      const message = (error as Error).message;
      const failed = pendingReward.txAttempts + 1 >= MAX_RETRIES;

      await prisma().pendingReward.update({
        where: { id: rewardId },
        data: {
          status: failed ? "FAILED" : "PENDING",
          lastError: message,
        },
      });

      eventBus.publish({
        event: "RewardSettlementFailed",
        userId: pendingReward.userId,
        rewardId,
        error: message,
        attempts: pendingReward.txAttempts + 1,
      });

      logger.error("Reward settlement failed", { rewardId, error: message });
      throw error;
    }
  }

  async processPendingRewards(limit = 50): Promise<Record<string, unknown>[]> {
    const pending = await prisma().pendingReward.findMany({
      where: {
        status: "PENDING",
        txAttempts: { lt: MAX_RETRIES },
      },
      take: limit,
      orderBy: { createdAt: "asc" },
    });

    const results: Record<string, unknown>[] = [];

    for (const reward of pending) {
      try {
        const result = await this.settleReward(reward.id);
        results.push(result);
      } catch (error) {
        results.push({ id: reward.id, status: "FAILED", error: (error as Error).message });
      }
    }

    return results;
  }

  async getSettlementStatus(userId: string): Promise<Record<string, unknown>> {
    const [pending, processing, paid, failed] = await Promise.all([
      prisma().pendingReward.count({ where: { userId, status: "PENDING" } }),
      prisma().pendingReward.count({ where: { userId, status: "PROCESSING" } }),
      prisma().pendingReward.count({ where: { userId, status: "PAID" } }),
      prisma().pendingReward.count({ where: { userId, status: "FAILED" } }),
    ]);

    const recent = await prisma().pendingReward.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        reward: true,
        amount: true,
        transactionHash: true,
        lastError: true,
        updatedAt: true,
      },
    });

    return {
      onChainEnabled: isBlockchainSettlementEnabled(),
      counts: { pending, processing, paid, failed },
      recent,
    };
  }

  async retryFailed(rewardId: string): Promise<Record<string, unknown>> {
    await prisma().pendingReward.update({
      where: { id: rewardId, status: "FAILED" },
      data: { status: "PENDING", txAttempts: 0, lastError: null },
    });
    return this.settleReward(rewardId);
  }

  private async submitBlockchainTransaction(reward: {
    id: string;
    userId: string;
    asset: string;
    amount: number;
    treasuryRequestId: string | null;
    txAttempts: number;
    user?: { wallet: string } | null;
  }): Promise<string> {
    const attempts = reward.txAttempts || 0;
    if (attempts >= MAX_RETRIES) {
      throw new Error("Max retries reached");
    }

    await sleep(BACKOFF_BASE * Math.pow(2, attempts));

    const wallet =
      reward.user?.wallet ??
      (await prisma().userProfile.findUnique({ where: { id: reward.userId }, select: { wallet: true } }))?.wallet;

    if (!wallet) {
      throw new Error("Recipient wallet not found");
    }

    return submitTreasuryPayout({
      recipientWallet: wallet,
      asset: reward.asset,
      amount: reward.amount,
      requestId: reward.treasuryRequestId ?? reward.id,
    });
  }
}
