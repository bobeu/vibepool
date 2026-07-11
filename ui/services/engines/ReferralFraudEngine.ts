import { createHash } from "crypto";
import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";

const FRAUD_THRESHOLD = Number(process.env.REFERRAL_FRAUD_THRESHOLD ?? 70);
const VELOCITY_WINDOW_MS = Number(process.env.REFERRAL_VELOCITY_WINDOW_MS ?? 60 * 60 * 1000);
const MAX_REFERRALS_PER_WINDOW = Number(process.env.REFERRAL_MAX_PER_WINDOW ?? 5);
const COOLDOWN_MS = Number(process.env.REFERRAL_COOLDOWN_MS ?? 24 * 60 * 60 * 1000);

export type FraudContext = {
  deviceHash?: string;
  ipHash?: string;
  walletCluster?: string;
};

export class ReferralFraudEngine {
  name = "ReferralFraudEngine";

  hash(value: string): string {
    return createHash("sha256").update(value).digest("hex").slice(0, 32);
  }

  async evaluateReferral(referralId: string, context: FraudContext): Promise<{ allowed: boolean; score: number; status: string }> {
    let score = 0;
    const signals: Array<{ signalType: string; score: number; metadata?: Record<string, unknown> }> = [];

    const referral = await prisma().referral.findUnique({
      where: { id: referralId },
      include: { referrer: { select: { id: true, wallet: true } } },
    });
    if (!referral) return { allowed: false, score: 100, status: "REJECTED" };

    if (context.deviceHash) {
      const sameDevice = await prisma().referral.count({
        where: {
          referrerId: referral.referrerId,
          deviceHash: context.deviceHash,
          id: { not: referralId },
        },
      });
      if (sameDevice > 0) {
        score += 40;
        signals.push({ signalType: "SAME_DEVICE", score: 40, metadata: { count: sameDevice } });
      }
    }

    if (context.ipHash) {
      const sameIp = await prisma().referral.count({
        where: {
          referrerId: referral.referrerId,
          ipHash: context.ipHash,
          id: { not: referralId },
        },
      });
      if (sameIp >= 2) {
        score += 30;
        signals.push({ signalType: "REPEATED_IP", score: 30, metadata: { count: sameIp } });
      }
    }

    if (context.walletCluster) {
      const clusterHits = await prisma().referralFraudSignal.count({
        where: {
          referral: { referrerId: referral.referrerId },
          signalType: "WALLET_CLUSTER",
          metadata: { path: ["cluster"], equals: context.walletCluster },
        },
      });
      if (clusterHits > 0) {
        score += 25;
        signals.push({ signalType: "WALLET_CLUSTER", score: 25 });
      }
    }

    const windowStart = new Date(Date.now() - VELOCITY_WINDOW_MS);
    const recentCount = await prisma().referral.count({
      where: { referrerId: referral.referrerId, createdAt: { gte: windowStart } },
    });
    if (recentCount > MAX_REFERRALS_PER_WINDOW) {
      score += 35;
      signals.push({ signalType: "VELOCITY", score: 35, metadata: { recentCount } });
    }

    const lastReferral = await prisma().referral.findFirst({
      where: { referrerId: referral.referrerId, id: { not: referralId } },
      orderBy: { createdAt: "desc" },
    });
    if (lastReferral?.createdAt && Date.now() - lastReferral.createdAt.getTime() < COOLDOWN_MS / 10) {
      score += 15;
      signals.push({ signalType: "COOLDOWN", score: 15 });
    }

    const status = score >= FRAUD_THRESHOLD ? "REVIEW" : score >= FRAUD_THRESHOLD / 2 ? "FLAGGED" : "CLEAR";

    await prisma().referral.update({
      where: { id: referralId },
      data: {
        fraudScore: score,
        fraudStatus: status as any,
        deviceHash: context.deviceHash ?? referral.deviceHash,
        ipHash: context.ipHash ?? referral.ipHash,
        flaggedAt: score >= FRAUD_THRESHOLD / 2 ? new Date() : null,
      },
    });

    for (const signal of signals) {
      await prisma().referralFraudSignal.create({
        data: {
          referralId,
          signalType: signal.signalType,
          score: signal.score,
          metadata: signal.metadata,
        },
      });
    }

    logger.info("Referral fraud evaluated", { referralId, score, status });
    return { allowed: status === "CLEAR", score, status };
  }

  walletCluster(wallet: string): string {
    const normalized = wallet.toLowerCase();
    return this.hash(normalized.slice(0, 10));
  }
}
