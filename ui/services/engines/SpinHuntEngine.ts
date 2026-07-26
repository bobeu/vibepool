import { createHash, randomBytes } from "crypto";
import { keccak256, toBytes, toHex } from "viem";
import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { creditSpinReward } from "@/lib/blockchain/spinVault";
import { verifySpinEntry } from "@/lib/blockchain/verifySpinEntry";
import {
  defaultEntryFee,
  isSpinPayAsset,
  type SpinPayAsset,
} from "@/lib/spin/economy";
import type { IEngine } from "./interfaces";
import { WheelEngine } from "./WheelEngine";
import { SpinEngine } from "./SpinEngine";
import { SecureRandomProvider } from "./SecureRandomProvider";
import { eventBus } from "./EventBus";

import type { PublicBubble } from "@/lib/spin/types";
import { isGuestWallet } from "@/lib/auth/guest";
import { MOCK_CREDIT_TX } from "@/lib/spin/freePlay";
import { collectionEngine, type SpinLoadout } from "./CollectionEngine";

type InternalBubble = PublicBubble & {
  amountWei: string;
  asset: string;
};

export type { PublicBubble };

type BubblePlan = {
  durationMs: number;
  bubbles: InternalBubble[];
};

function hashSeed(seed: string): number {
  const h = createHash("sha256").update(seed).digest();
  return h.readUInt32BE(0) / 0xffffffff;
}

function mulberry32(a: number) {
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function requestIdFor(parts: string): `0x${string}` {
  return keccak256(toBytes(parts));
}

export class SpinHuntEngine implements IEngine {
  name = "SpinHuntEngine";
  private spinEngine = new SpinEngine();
  private wheelEngine = new WheelEngine();

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getOrCreateConfig() {
    const existing = await prisma().spinConfig.findUnique({ where: { key: "default" } });
    if (existing) return existing;
    return prisma().spinConfig.create({
      data: { key: "default" },
    });
  }

  async getPublicConfig() {
    const cfg = await this.getOrCreateConfig();
    const entryAsset = isSpinPayAsset(cfg.entryAsset) ? cfg.entryAsset : "USDm";
    return {
      treasuryBps: cfg.treasuryBps,
      entryFeeWei: cfg.entryFeeWei,
      entryAsset,
      xpCostPerSpin: cfg.xpCostPerSpin,
      spinDurationSec: cfg.spinDurationSec,
      baseWheelRpm: cfg.baseWheelRpm,
      maxBubbleCashWei: cfg.maxBubbleCashWei,
      maxCashPerSpinWei: cfg.maxCashPerSpinWei,
      defaultEntryFees: {
        CELO: defaultEntryFee("CELO").toString(),
        USDm: defaultEntryFee("USDm").toString(),
        USDC: defaultEntryFee("USDC").toString(),
        USDT: defaultEntryFee("USDT").toString(),
      },
    };
  }

  private buildBubblePlan(
    serverSeed: string,
    cfg: {
      spinDurationSec: number;
      maxBubbleCashWei: string;
      maxCashPerSpinWei: string;
      entryAsset: string;
    },
    loadout: SpinLoadout
  ): BubblePlan {
    const durationMs = Math.max(6, cfg.spinDurationSec) * 1000;
    const rng = mulberry32(Math.floor(hashSeed(serverSeed) * 1e9));
    const cashAsset = isSpinPayAsset(cfg.entryAsset) ? cfg.entryAsset : "USDm";
    const maxBubble = BigInt(cfg.maxBubbleCashWei || "0");
    const maxSpin = BigInt(cfg.maxCashPerSpinWei || "0");
    const count = 8 + Math.floor(rng() * 5); // 8–12 bubbles
    const bubbles: InternalBubble[] = [];
    let allocated = 0n;

    for (let i = 0; i < count; i++) {
      const spawnAtMs = Math.floor(rng() * (durationMs - 1200));
      const lifetimeMs = 900 + Math.floor(rng() * 1400);
      const baseTaps = rng() > 0.75 ? 2 : 1;
      const tapsRequired = Math.max(1, baseTaps - loadout.buzzerTapBonus);
      // Micro cash — small share of max bubble, capped by remaining spin budget
      let amount = maxBubble > 0n ? (maxBubble * BigInt(10 + Math.floor(rng() * 90))) / 100n : 0n;
      if (amount > maxSpin - allocated) amount = maxSpin > allocated ? maxSpin - allocated : 0n;
      allocated += amount;

      bubbles.push({
        id: `b${i}_${toHex(randomBytes(4)).slice(2)}`,
        spawnAtMs,
        lifetimeMs,
        tapsRequired,
        x: Math.round(8 + rng() * 84),
        pathSeed: Math.floor(rng() * 1e9),
        amountWei: amount.toString(),
        asset: cashAsset,
      });
    }

    return { durationMs, bubbles };
  }

  private publicPlan(plan: BubblePlan): { durationMs: number; bubbles: PublicBubble[] } {
    return {
      durationMs: plan.durationMs,
      bubbles: plan.bubbles.map(({ id, spawnAtMs, lifetimeMs, tapsRequired, x, pathSeed }) => ({
        id,
        spawnAtMs,
        lifetimeMs,
        tapsRequired,
        x,
        pathSeed,
      })),
    };
  }

  async startSession(input: {
    wallet: string;
    userId: string;
    useTicket?: boolean;
    entryTxHash?: string;
    sessionRef?: `0x${string}`;
    entryAsset?: SpinPayAsset;
  }): Promise<Record<string, unknown>> {
    const cfg = await this.getOrCreateConfig();
    const active = await prisma().spinSession.findFirst({
      where: { userId: input.userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
    });
    if (active) {
      const plan = active.bubblePlan as BubblePlan;
      const loadout = (active.loadout as SpinLoadout | null) ?? {
        rpmMultiplier: 1,
        buzzerTapBonus: 0,
        musicTrackId: null,
        musicUrl: null,
        itemSlugs: [],
      };
      return {
        sessionId: active.id,
        status: active.status,
        cashEarnedWei: active.cashEarnedWei,
        cashAsset: active.cashAsset,
        startedAt: active.startedAt.toISOString(),
        expiresAt: active.expiresAt.toISOString(),
        rpm: Math.round(cfg.baseWheelRpm * (loadout.rpmMultiplier || 1)),
        loadout,
        plan: this.publicPlan(plan),
        resumed: true,
      };
    }

    let entryTxHash: string | null = null;
    let entryAsset: string | null = null;

    if (input.useTicket !== false && !input.entryTxHash) {
      const consumed = await this.spinEngine.consumeSpin(input.userId);
      if (!consumed) {
        // Optional XP gate when configured
        if (cfg.xpCostPerSpin > 0) {
          const profile = await prisma().userProfile.findUnique({ where: { id: input.userId } });
          if (profile && profile.xp >= cfg.xpCostPerSpin) {
            await prisma().userProfile.update({
              where: { id: input.userId },
              data: { xp: { decrement: cfg.xpCostPerSpin } },
            });
          } else {
            return {
              success: false,
              code: "ENTRY_REQUIRED",
              message: "No spins available — pay entry fee via SpinEconomy",
              config: await this.getPublicConfig(),
            };
          }
        } else {
          return {
            success: false,
            code: "ENTRY_REQUIRED",
            message: "No spins available — pay entry fee via SpinEconomy",
            config: await this.getPublicConfig(),
          };
        }
      }
    } else {
      if (!input.entryTxHash || !input.sessionRef || !input.entryAsset) {
        throw new Error("Paid entry requires txHash, sessionRef, and asset");
      }
      const minFee =
        BigInt(cfg.entryFeeWei || "0") > 0n && cfg.entryAsset === input.entryAsset
          ? BigInt(cfg.entryFeeWei)
          : defaultEntryFee(input.entryAsset);

      const verified = await verifySpinEntry({
        txHash: input.entryTxHash,
        expectedFrom: input.wallet,
        expectedAsset: input.entryAsset,
        expectedSessionRef: input.sessionRef,
        minAmountWei: minFee,
      });

      // Prevent replay of the same entry tx
      const reused = await prisma().spinSession.findFirst({
        where: { entryTxHash: verified.txHash },
      });
      if (reused) throw new Error("Entry transaction already used");

      entryTxHash = verified.txHash;
      entryAsset = verified.asset;
    }

    const loadout = await collectionEngine.resolveLoadout(input.userId);
    const serverSeed = toHex(randomBytes(32));
    const plan = this.buildBubblePlan(
      serverSeed,
      {
        spinDurationSec: cfg.spinDurationSec,
        maxBubbleCashWei: cfg.maxBubbleCashWei,
        maxCashPerSpinWei: cfg.maxCashPerSpinWei,
        entryAsset: entryAsset || cfg.entryAsset,
      },
      loadout
    );
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + plan.durationMs + 5_000);
    const rpm = Math.round(cfg.baseWheelRpm * loadout.rpmMultiplier);

    const session = await prisma().spinSession.create({
      data: {
        userId: input.userId,
        status: "ACTIVE",
        entryTxHash,
        entryAsset,
        serverSeed,
        loadout: loadout as object,
        bubblePlan: JSON.parse(JSON.stringify(plan)),
        cashEarnedWei: "0",
        cashAsset: isSpinPayAsset(cfg.entryAsset) ? cfg.entryAsset : "USDm",
        expiresAt,
      },
    });

    eventBus.publish({ event: "SpinHuntStarted", userId: input.userId, sessionId: session.id });
    logger.info("Spin hunt session started", { sessionId: session.id, userId: input.userId });

    return {
      success: true,
      sessionId: session.id,
      status: session.status,
      cashEarnedWei: "0",
      cashAsset: session.cashAsset,
      startedAt: session.startedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      rpm,
      loadout,
      plan: this.publicPlan(plan),
      resumed: false,
    };
  }

  async recordHit(input: {
    userId: string;
    sessionId: string;
    bubbleId: string;
    taps?: number;
    clientElapsedMs?: number;
  }): Promise<Record<string, unknown>> {
    const session = await prisma().spinSession.findFirst({
      where: { id: input.sessionId, userId: input.userId },
    });
    if (!session) throw new Error("Session not found");
    if (session.status !== "ACTIVE") throw new Error("Session is not active");
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma().spinSession.update({
        where: { id: session.id },
        data: { status: "CANCELLED", finishedAt: new Date() },
      });
      throw new Error("Session expired");
    }

    const plan = session.bubblePlan as BubblePlan;
    const bubble = plan.bubbles.find((b) => b.id === input.bubbleId);
    if (!bubble) throw new Error("Unknown bubble");

    const elapsed =
      typeof input.clientElapsedMs === "number"
        ? input.clientElapsedMs
        : Date.now() - session.startedAt.getTime();

    // Allow small clock skew
    if (elapsed + 400 < bubble.spawnAtMs) throw new Error("Bubble not spawned yet");
    if (elapsed - 600 > bubble.spawnAtMs + bubble.lifetimeMs) {
      throw new Error("Bubble expired");
    }

    const taps = Math.max(1, input.taps ?? 1);
    if (taps < bubble.tapsRequired) {
      return { success: false, code: "MORE_TAPS", tapsRequired: bubble.tapsRequired, taps };
    }

    try {
      await prisma().bubbleHit.create({
        data: {
          sessionId: session.id,
          userId: input.userId,
          bubbleId: bubble.id,
          amountWei: bubble.amountWei,
          asset: bubble.asset,
          taps,
        },
      });
    } catch {
      throw new Error("Bubble already claimed");
    }

    const earned = BigInt(session.cashEarnedWei) + BigInt(bubble.amountWei);
    const cfg = await this.getOrCreateConfig();
    const capped =
      BigInt(cfg.maxCashPerSpinWei) > 0n && earned > BigInt(cfg.maxCashPerSpinWei)
        ? BigInt(cfg.maxCashPerSpinWei)
        : earned;

    await prisma().spinSession.update({
      where: { id: session.id },
      data: { cashEarnedWei: capped.toString(), cashAsset: bubble.asset },
    });

    return {
      success: true,
      bubbleId: bubble.id,
      amountWei: bubble.amountWei,
      asset: bubble.asset,
      cashEarnedWei: capped.toString(),
      cashAsset: bubble.asset,
    };
  }

  private async enqueueCredit(input: {
    userId: string;
    wallet: string;
    sessionId: string;
    asset: SpinPayAsset;
    amountWei: bigint;
    source: "BUBBLE" | "WHEEL";
    suffix: string;
  }) {
    if (input.amountWei <= 0n) return null;
    const requestId = requestIdFor(`${input.sessionId}:${input.source}:${input.suffix}`);

    const pending = await prisma().spinRewardPending.upsert({
      where: { requestId },
      create: {
        userId: input.userId,
        wallet: input.wallet.toLowerCase(),
        sessionId: input.sessionId,
        asset: input.asset,
        amountWei: input.amountWei.toString(),
        requestId,
        source: input.source,
        status: "PENDING_SYNC",
      },
      update: {},
    });

    if (pending.status === "CREDITED_ONCHAIN" || pending.status === "WITHDRAWN") {
      return pending;
    }

    // Free-play guests: mock credit only — never broadcast a real vault tx.
    if (isGuestWallet(input.wallet)) {
      return prisma().spinRewardPending.update({
        where: { id: pending.id },
        data: {
          status: "CREDITED_ONCHAIN",
          creditTxHash: MOCK_CREDIT_TX,
          lastError: null,
        },
      });
    }

    const credited = await creditSpinReward({
      wallet: input.wallet,
      asset: input.asset,
      amountWei: input.amountWei,
      requestId: requestId as `0x${string}`,
    });

    if ("hash" in credited) {
      return prisma().spinRewardPending.update({
        where: { id: pending.id },
        data: { status: "CREDITED_ONCHAIN", creditTxHash: credited.hash, lastError: null },
      });
    }

    return prisma().spinRewardPending.update({
      where: { id: pending.id },
      data: { lastError: credited.error },
    });
  }

  /** Aggregated mock/real claimable rows still open for withdraw UI. */
  async getClaimableSummary(wallet: string, userId: string) {
    const rows = await prisma().spinRewardPending.findMany({
      where: {
        userId,
        status: { in: ["PENDING_SYNC", "CREDITED_ONCHAIN"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const byAsset: Record<string, { amountWei: string; canWithdraw: boolean }> = {};
    for (const row of rows) {
      const prev = BigInt(byAsset[row.asset]?.amountWei ?? "0");
      byAsset[row.asset] = {
        amountWei: (prev + BigInt(row.amountWei)).toString(),
        // Free-play: always show withdraw when owed. Real wallets still need vault liquidity (Phase 3).
        canWithdraw: isGuestWallet(wallet) ? true : true,
      };
    }

    const totalWei = rows.reduce((sum, r) => sum + BigInt(r.amountWei), 0n);
    return {
      freePlay: isGuestWallet(wallet),
      rows: rows.map((r) => ({
        id: r.id,
        asset: r.asset,
        amountWei: r.amountWei,
        status: r.status,
        source: r.source,
      })),
      byAsset,
      totalWei: totalWei.toString(),
      canWithdraw: totalWei > 0n && isGuestWallet(wallet),
    };
  }

  /** Free-play only: clear claimable rows and notify — no chain transfer. */
  async mockWithdraw(wallet: string, userId: string) {
    if (!isGuestWallet(wallet)) {
      throw new Error("Mock withdraw is only available in free play");
    }

    const rows = await prisma().spinRewardPending.findMany({
      where: {
        userId,
        status: { in: ["PENDING_SYNC", "CREDITED_ONCHAIN"] },
      },
    });

    if (rows.length === 0) {
      return { success: false, message: "Nothing to withdraw" };
    }

    await prisma().spinRewardPending.deleteMany({
      where: { id: { in: rows.map((r) => r.id) } },
    });

    const { NotificationEngine } = await import("./NotificationEngine");
    const notifications = new NotificationEngine();
    await notifications.send(
      userId,
      "REWARD",
      "Successful withdraw",
      "Your free-play rewards were withdrawn successfully. (Demo — no funds sent.)",
      "HIGH"
    );

    return {
      success: true,
      message: "Successful withdraw",
      cleared: rows.length,
      mock: true,
    };
  }

  async finishSession(input: {
    wallet: string;
    userId: string;
    sessionId: string;
  }): Promise<Record<string, unknown>> {
    const session = await prisma().spinSession.findFirst({
      where: { id: input.sessionId, userId: input.userId },
    });
    if (!session) throw new Error("Session not found");
    if (session.status === "FINISHED") {
      return { success: true, sessionId: session.id, alreadyFinished: true };
    }
    if (session.status !== "ACTIVE") throw new Error("Session is not active");

    const wheel = await this.wheelEngine.generateSpin(input.userId, new SecureRandomProvider());

    await prisma().spinSession.update({
      where: { id: session.id },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        wheelRewardId: typeof wheel.spinId === "string" ? wheel.spinId : null,
      },
    });

    const cashAsset = isSpinPayAsset(session.cashAsset) ? session.cashAsset : "USDm";
    const bubbleCash = BigInt(session.cashEarnedWei || "0");
    let bubblePending = null;
    if (bubbleCash > 0n) {
      bubblePending = await this.enqueueCredit({
        userId: input.userId,
        wallet: input.wallet,
        sessionId: session.id,
        asset: cashAsset,
        amountWei: bubbleCash,
        source: "BUBBLE",
        suffix: "total",
      });
    }

    // Token wheel prizes buffer into vault credit when asset is a pay asset
    let wheelPending = null;
    const rawAsset = String(wheel.asset ?? "");
    const normalizedWheel: SpinPayAsset | null =
      rawAsset === "USDm" || rawAsset.toUpperCase() === "USDM" || rawAsset.toUpperCase() === "CUSD"
        ? "USDm"
        : rawAsset.toUpperCase() === "CELO"
          ? "CELO"
          : rawAsset.toUpperCase() === "USDC"
            ? "USDC"
            : rawAsset.toUpperCase() === "USDT"
              ? "USDT"
              : null;

    if (normalizedWheel && Number(wheel.amount) > 0) {
      const { parseUnits } = await import("viem");
      const { assetDecimals } = await import("@/lib/tokens/celoAssets");
      const amountWei = parseUnits(String(wheel.amount), assetDecimals(normalizedWheel));
      wheelPending = await this.enqueueCredit({
        userId: input.userId,
        wallet: input.wallet,
        sessionId: session.id,
        asset: normalizedWheel,
        amountWei,
        source: "WHEEL",
        suffix: String(wheel.spinId ?? "wheel"),
      });
    }

    eventBus.publish({
      event: "SpinHuntFinished",
      userId: input.userId,
      sessionId: session.id,
      cashEarnedWei: session.cashEarnedWei,
      wheel,
    });

    return {
      success: true,
      sessionId: session.id,
      cashEarnedWei: session.cashEarnedWei,
      cashAsset: session.cashAsset,
      wheel,
      bubbleCredit: bubblePending
        ? { status: bubblePending.status, requestId: bubblePending.requestId, txHash: bubblePending.creditTxHash }
        : null,
      wheelCredit: wheelPending
        ? { status: wheelPending.status, requestId: wheelPending.requestId, txHash: wheelPending.creditTxHash }
        : null,
    };
  }
}

export const spinHuntEngine = new SpinHuntEngine();
