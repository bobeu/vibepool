import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import { SecureRandomProvider } from "./SecureRandomProvider";
import type { ISpinEngine, IRandomProvider } from "./interfaces";

export class SpinEngine implements ISpinEngine {
  name = "SpinEngine";
  private randomProvider = new SecureRandomProvider();

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async grantSpin(userId: string, source: string, reason?: string): Promise<Record<string, unknown>> {
    const updated = await prisma().userProfile.update({
      where: { id: userId },
      data: { spins: { increment: 1 } },
    });

    await prisma().spinLedger.create({
      data: {
        userId,
        spinType: source as any,
        amount: 1,
        reason: reason || source,
      },
    });

    eventBus.publish({
      event: "SpinGranted",
      userId,
      source,
      totalSpins: updated.spins,
    });

    logger.info("Spin granted", { userId, source });
    return { granted: true, totalSpins: updated.spins };
  }

  async consumeSpin(userId: string): Promise<boolean> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile || profile.spins <= 0) {
      return false;
    }

    await prisma().userProfile.update({
      where: { id: userId },
      data: { spins: { decrement: 1 } },
    });

    await prisma().spinLedger.create({
      data: {
        userId,
        spinType: "REWARD",
        amount: -1,
        reason: "SPIN_CONSUMED",
      },
    });

    return true;
  }

  async getSpinBalance(userId: string): Promise<{ available: number; daily: number; lifetime: number }> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return { available: 0, daily: 0, lifetime: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailySpins = await prisma().spinLedger.count({
      where: {
        userId,
        createdAt: { gte: today },
        amount: { gt: 0 },
      },
    });

    const lifetimeSpins = await prisma().spinLedger.count({
      where: {
        userId,
        amount: { gt: 0 },
      },
    });

    return {
      available: profile.spins,
      daily: dailySpins,
      lifetime: lifetimeSpins,
    };
  }
}
