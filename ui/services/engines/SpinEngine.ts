import { prisma } from "@/lib/auth/session";
import { isGuestWallet } from "@/lib/auth/guest";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import { SecureRandomProvider } from "./SecureRandomProvider";
import type { ISpinEngine, IRandomProvider } from "./interfaces";

export class SpinEngine implements ISpinEngine {
  name = "SpinEngine";
  private randomProvider = new SecureRandomProvider();
  private static LEGACY_NON_FREE_AUTO_REASONS = new Set(["WELCOME_SPINS", "DAILY_FREE_SPIN"]);

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
      select: { id: true, wallet: true, spins: true },
    });

    if (!profile || profile.spins <= 0) {
      return false;
    }

    // Policy guard: for non-free wallets, ignore legacy auto-grants that were
    // previously issued by old login/daily behavior.
    if (typeof profile.wallet === "string" && !isGuestWallet(profile.wallet)) {
      const allowed = await this.getNonFreeEffectiveSpins(userId);
      if (allowed <= 0) {
        return false;
      }
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

  /** Grant welcome spins to brand-new pay-mode users (once). */
  async ensureWelcomeSpins(userId: string): Promise<boolean> {
    const any = await prisma().spinLedger.findFirst({
      where: { userId, spinType: "WELCOME" as any },
    });
    if (any) return false;

    const { PAY_MODE_MAX_WELCOME_SPINS } = await import("@/lib/spin/freePlay");
    for (let i = 0; i < PAY_MODE_MAX_WELCOME_SPINS; i++) {
      await this.grantSpin(userId, "WELCOME", "NEW_USER_WELCOME_SPIN");
    }
    logger.info("Welcome spins granted", { userId, count: PAY_MODE_MAX_WELCOME_SPINS });
    return true;
  }

  /** Grant one DAILY free spin if the user has not received one today. */
  async ensureDailyFreeSpin(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const already = await prisma().spinLedger.findFirst({
      where: {
        userId,
        spinType: "DAILY",
        amount: { gt: 0 },
        createdAt: { gte: today },
      },
    });
    if (already) return false;

    await this.grantSpin(userId, "DAILY", "DAILY_FREE_SPIN");
    return true;
  }

  async getSpinBalance(userId: string): Promise<{ available: number; daily: number; lifetime: number }> {
    const profile = await prisma().userProfile.findUnique({
      where: { id: userId },
      select: { id: true, wallet: true, spins: true },
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

    const available =
      typeof profile.wallet === "string" && !isGuestWallet(profile.wallet)
        ? await this.getNonFreeEffectiveSpins(userId)
        : profile.spins;

    return {
      available,
      daily: dailySpins,
      lifetime: lifetimeSpins,
    };
  }

  private async getNonFreeEffectiveSpins(userId: string): Promise<number> {
    const rows = await prisma().spinLedger.findMany({
      where: { userId },
      select: { amount: true, reason: true },
    });

    let effective = 0;
    for (const row of rows) {
      const amount = Number(row.amount ?? 0);
      if (
        amount > 0 &&
        SpinEngine.LEGACY_NON_FREE_AUTO_REASONS.has(String(row.reason ?? ""))
      ) {
        continue;
      }
      effective += amount;
    }
    return Math.max(0, effective);
  }
}
