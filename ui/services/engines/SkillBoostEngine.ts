import { prisma } from "@/lib/prisma";
import {
  SKILL_BOOST_CONFIG,
  type SkillBoostPurpose,
} from "@/lib/arena/skillBoost";
import { verifySkillDeposit } from "@/lib/blockchain/verifySkillDeposit";
import { eventBus } from "./EventBus";

export class SkillBoostEngine {
  name = "SkillBoostEngine";

  private async resolveId(wallet: string): Promise<string | null> {
    const normalized = wallet.toLowerCase();
    const user = await prisma().userProfile.findUnique({
      where: { wallet: normalized },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  async recordAndApply(input: {
    wallet: string;
    txHash: string;
    asset: "USDm" | "CELO";
    purpose: SkillBoostPurpose;
    matchId?: string;
  }): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(input.wallet);
    if (!userId) throw new Error("User not found");

    const existing = await prisma().skillBoostPayment.findUnique({
      where: { txHash: input.txHash },
    });
    if (existing) {
      return {
        paymentId: existing.id,
        purpose: existing.purpose,
        duplicate: true,
        expiresAt: existing.expiresAt,
      };
    }

    const verified = await verifySkillDeposit({
      txHash: input.txHash,
      expectedFrom: input.wallet,
      asset: input.asset,
      purpose: input.purpose,
    });

    const cfg = SKILL_BOOST_CONFIG[input.purpose];
    const expiresAt =
      cfg.durationMs > 0 ? new Date(Date.now() + cfg.durationMs) : null;

    const payment = await prisma().skillBoostPayment.create({
      data: {
        userId,
        txHash: verified.txHash,
        asset: verified.asset,
        amountWei: verified.amountWei,
        purpose: input.purpose,
        matchId: input.matchId ?? null,
        expiresAt,
        verified: true,
      },
    });

    if (input.purpose === "POINTS_GROWTH" && cfg.pointsGrant > 0) {
      await prisma().userProfile.update({
        where: { id: userId },
        data: { points: { increment: cfg.pointsGrant } },
      });
    }

    eventBus.publish({
      event: "SkillBoostPurchased",
      userId,
      aggregateId: payment.id,
      aggregateType: "SkillBoostPayment",
      purpose: input.purpose,
      txHash: verified.txHash,
      asset: verified.asset,
    });

    return {
      paymentId: payment.id,
      purpose: input.purpose,
      asset: verified.asset,
      amountWei: verified.amountWei,
      expiresAt,
      pointsGranted: input.purpose === "POINTS_GROWTH" ? cfg.pointsGrant : 0,
      xpMultiplier: cfg.xpMultiplier,
      pointsMultiplier: cfg.pointsMultiplier,
    };
  }

  /** Active multipliers for the next/current arena match rewards. */
  async getActiveMultipliers(userId: string): Promise<{
    xpMultiplier: number;
    pointsMultiplier: number;
    stayRelevant: boolean;
    consumeBoostIds: string[];
  }> {
    const now = new Date();
    const payments = await prisma().skillBoostPayment.findMany({
      where: {
        userId,
        verified: true,
        OR: [
          { purpose: "ARENA_BOOST", matchId: null },
          { purpose: "STAY_RELEVANT", expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    let xpMultiplier = 1;
    let pointsMultiplier = 1;
    let stayRelevant = false;
    const consumeBoostIds: string[] = [];

    for (const p of payments) {
      if (p.purpose === "STAY_RELEVANT") {
        stayRelevant = true;
        xpMultiplier = Math.max(xpMultiplier, SKILL_BOOST_CONFIG.STAY_RELEVANT.xpMultiplier);
      }
      if (p.purpose === "ARENA_BOOST" && !p.matchId) {
        xpMultiplier = Math.max(xpMultiplier, SKILL_BOOST_CONFIG.ARENA_BOOST.xpMultiplier);
        pointsMultiplier = Math.max(
          pointsMultiplier,
          SKILL_BOOST_CONFIG.ARENA_BOOST.pointsMultiplier
        );
        consumeBoostIds.push(p.id);
        break; // one unused arena boost
      }
    }

    return { xpMultiplier, pointsMultiplier, stayRelevant, consumeBoostIds };
  }

  async attachBoostToMatch(userId: string, matchId: string, paymentIds: string[]): Promise<void> {
    if (paymentIds.length === 0) return;
    await prisma().skillBoostPayment.updateMany({
      where: { id: { in: paymentIds }, userId, matchId: null },
      data: { matchId },
    });
  }

  async getStatus(wallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) return { stayRelevant: false, unusedBoosts: 0 };

    const now = new Date();
    const [relevant, unusedBoosts, multipliers] = await Promise.all([
      prisma().skillBoostPayment.findFirst({
        where: { userId, purpose: "STAY_RELEVANT", verified: true, expiresAt: { gt: now } },
        orderBy: { expiresAt: "desc" },
      }),
      prisma().skillBoostPayment.count({
        where: { userId, purpose: "ARENA_BOOST", verified: true, matchId: null },
      }),
      this.getActiveMultipliers(userId),
    ]);

    return {
      stayRelevant: Boolean(relevant),
      stayRelevantUntil: relevant?.expiresAt ?? null,
      unusedBoosts,
      xpMultiplier: multipliers.xpMultiplier,
      pointsMultiplier: multipliers.pointsMultiplier,
      fees: {
        USDm: "0.01",
        CELO: "0.05",
      },
    };
  }
}

export const skillBoostEngine = new SkillBoostEngine();
