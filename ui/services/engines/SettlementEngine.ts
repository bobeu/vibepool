import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
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
    });

    if (!pendingReward) {
      throw new Error("Pending reward not found");
    }

    if (pendingReward.status === "PAID") {
      return { id: pendingReward.id, status: "PAID" };
    }

    await prisma().pendingReward.update({
      where: { id: rewardId },
      data: { status: "PROCESSING", txAttempts: { increment: 1 } },
    });

    try {
      const txHash = await this.submitBlockchainTransaction(pendingReward);

      await prisma().$transaction(async (tx) => {
        await tx.pendingReward.update({
          where: { id: rewardId },
          data: { status: "PAID", transactionHash: txHash },
        });

        await tx.rewardLedger.create({
          data: {
            userId: pendingReward.userId,
            reward: pendingReward.reward,
            asset: pendingReward.asset,
            amount: pendingReward.amount,
            reason: pendingReward.reason,
            transactionHash: txHash,
            treasuryRequestId: pendingReward.treasuryRequestId,
          },
        });
      });

      logger.info("Reward settled", { rewardId, txHash });
      return { id: rewardId, status: "PAID", transactionHash: txHash };
    } catch (error) {
      await prisma().pendingReward.update({
        where: { id: rewardId },
        data: {
          status: "FAILED",
          lastError: (error as Error).message,
        },
      });

      logger.error("Reward settlement failed", { rewardId, error: (error as Error).message });
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
    });

    const results: Record<string, unknown>[] = [];

    for (const reward of pending) {
      try {
        await this.settleReward(reward.id);
        results.push({ id: reward.id, status: "PAID" });
      } catch (error) {
        results.push({ id: reward.id, status: "FAILED", error: (error as Error).message });
      }
    }

    return results;
  }

  private async submitBlockchainTransaction(
    reward: Record<string, unknown>
  ): Promise<string> {
    const attempts = (reward.txAttempts as number) || 0;
    if (attempts >= MAX_RETRIES) {
      throw new Error("Max retries reached");
    }

    await sleep(BACKOFF_BASE * Math.pow(2, attempts));

    const mockHash = "0x" + Math.random().toString(16).slice(2).padEnd(64, "0");
    return mockHash;
  }
}
