import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IWheelEngine, IRandomProvider } from "./interfaces";

export class WheelEngine implements IWheelEngine {
  name = "WheelEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async generateSpin(userId: string, randomProvider: IRandomProvider): Promise<Record<string, unknown>> {
    const rewards = await prisma().spinReward.findMany({
      where: { active: true },
    });

    if (rewards.length === 0) {
      return { reward: null, message: "No active wheel rewards" };
    }

    const weights = rewards.map((r) => r.weight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = await randomProvider.next();
    random *= totalWeight;

    let selected = rewards[0];
    for (let i = 0; i < rewards.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selected = rewards[i];
        break;
      }
    }

    const spinHistory = await prisma().spinHistory.create({
      data: {
        userId,
        spinRewardId: selected.id,
        reward: selected.name,
        asset: selected.asset,
        amount: selected.amount,
        reason: selected.rarity,
      },
    });

    eventBus.publish({
      event: "SpinCompleted",
      userId,
      spinId: spinHistory.id,
      reward: selected.name,
      asset: selected.asset,
      amount: selected.amount,
      rarity: selected.rarity,
    });

    logger.info("Wheel spin generated", { userId, reward: selected.name });
    return {
      spinId: spinHistory.id,
      reward: selected.name,
      asset: selected.asset,
      amount: selected.amount,
      rarity: selected.rarity,
    };
  }

  async generateReward(spinId: string, _randomProvider: IRandomProvider): Promise<Record<string, unknown>> {
    const history = await prisma().spinHistory.findUnique({
      where: { id: spinId },
    });

    if (!history) {
      return { reward: null, message: "Spin history not found" };
    }

    return {
      spinId,
      reward: history.reward,
      asset: history.asset,
      amount: history.amount,
    };
  }

  async getSpinHistory(userId: string, limit = 20): Promise<Record<string, unknown>[]> {
    const history = await prisma().spinHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { spinReward: true },
    });

    return history.map((h) => ({
      id: h.id,
      userId: h.userId,
      reward: h.reward,
      asset: h.asset,
      amount: h.amount,
      reason: h.reason,
      createdAt: h.createdAt,
    }));
  }
}
