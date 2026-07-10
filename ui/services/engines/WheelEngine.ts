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

    const seed = crypto.randomUUID();
    const rawRandom = await randomProvider.next();
    const random = rawRandom * rewards.reduce((sum, r) => sum + r.weight, 0);

    let selected = rewards[0];
    let remaining = random;
    for (let i = 0; i < rewards.length; i++) {
      remaining -= rewards[i].weight;
      if (remaining <= 0) {
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
        seed,
        randomNumber: rawRandom.toString(),
        weightUsed: selected.weight,
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
      seed,
      randomNumber: rawRandom,
      weightUsed: selected.weight,
    });

    logger.info("Wheel spin generated", { userId, reward: selected.name, seed });
    return {
      spinId: spinHistory.id,
      reward: selected.name,
      asset: selected.asset,
      amount: selected.amount,
      rarity: selected.rarity,
      seed,
      randomNumber: rawRandom,
      weightUsed: selected.weight,
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
      seed: history.seed,
      randomNumber: history.randomNumber,
      weightUsed: history.weightUsed,
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
      seed: h.seed,
      randomNumber: h.randomNumber,
      weightUsed: h.weightUsed,
      createdAt: h.createdAt,
    }));
  }
}
