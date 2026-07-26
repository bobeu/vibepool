import { parseEther } from "viem";
import { USDM_CELO, ZERO_ADDRESS, type Address } from "@/config/constants";

/** Skill boost purposes — flat fees to treasury, never a wager/prize stake. */
export type SkillBoostPurpose = "ARENA_BOOST" | "STAY_RELEVANT" | "POINTS_GROWTH";

export const CUSD_CELO = USDM_CELO;

/** Tiny fees tuned for frequent MiniPay txs (not gambling stakes). */
export const SKILL_BOOST_FEES = {
  /** MiniPay preferred: ~0.01 cUSD */
  cUSD: parseEther("0.01"),
  /** Non-MiniPay: ~0.05 CELO */
  CELO: parseEther("0.05"),
} as const;

export const SKILL_BOOST_CONFIG = {
  /** Next ranked duel: 2× XP + points from skill outcome */
  ARENA_BOOST: { xpMultiplier: 2, pointsMultiplier: 2, durationMs: 0, pointsGrant: 0 },
  /** 24h active badge + soft XP bump on arena matches */
  STAY_RELEVANT: { xpMultiplier: 1.25, pointsMultiplier: 1, durationMs: 24 * 60 * 60 * 1000, pointsGrant: 0 },
  /** Flat progression purchase (not a bet) */
  POINTS_GROWTH: { xpMultiplier: 1, pointsMultiplier: 1, durationMs: 0, pointsGrant: 40 },
} as const;

export const PERFECT_HIT_THRESHOLD = 1; // within 1% of target
export const PERFECT_HIT_BONUS_XP = 25;
export const STREAK_XP_BONUS_PER = 5; // +5 XP per win streak step, capped
export const STREAK_XP_BONUS_CAP = 40;

export function getTreasuryAddress(): Address {
  const fromEnv = process.env.NEXT_PUBLIC_REWARD_TREASURY_ADDRESS?.trim();
  if (fromEnv && fromEnv.startsWith("0x") && fromEnv.length === 42) {
    return fromEnv as Address;
  }
  return ZERO_ADDRESS;
}

export function getSkillBoostChainId(): number {
  const raw = process.env.NEXT_PUBLIC_SKILL_BOOST_CHAIN_ID;
  if (raw) return Number(raw);
  // Contracts currently deployed on Celo Sepolia; MiniPay mainnet can override via env.
  return Number(process.env.NEXT_PUBLIC_CELO_CHAIN_ID ?? 11142220);
}

export function assetForMiniPay(isMiniPay: boolean): "cUSD" | "CELO" {
  return isMiniPay ? "cUSD" : "CELO";
}

export function feeForAsset(asset: "cUSD" | "CELO"): bigint {
  return asset === "cUSD" ? SKILL_BOOST_FEES.cUSD : SKILL_BOOST_FEES.CELO;
}
