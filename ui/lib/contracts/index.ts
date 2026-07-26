/**
 * Contract registry — Celo mainnet (42220) only.
 * Addresses: env overrides win; else addresses.json after `bun run sync` in smartContracts.
 */

import addresses from "./addresses.json";
import abis from "./abis.json";
import type { Address } from "@/types";
import { ZERO_ADDRESS } from "@/config/constants";

const MAINNET_CHAIN_ID = "42220";

type NetworkMap = Record<string, string>;
type ContractKey = "RewardTreasury" | "PointsManager" | "ActivityRegistry" | "SpinRewardManager";

function mainnetAddress(map: NetworkMap | undefined): Address {
  const addr = map?.[MAINNET_CHAIN_ID];
  if (addr && addr.startsWith("0x") && addr.length === 42) return addr as Address;
  return ZERO_ADDRESS;
}

function envOr(map: NetworkMap | undefined, envKey: string): Address {
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv && fromEnv.startsWith("0x") && fromEnv.length === 42) {
    return fromEnv as Address;
  }
  return mainnetAddress(map);
}

function contract(
  name: ContractKey,
  envKey: string
): { address: Address; abi: unknown } | null {
  const map = addresses[name] as NetworkMap | undefined;
  const abi = abis[name as keyof typeof abis];
  if (!abi) return null;
  const address = envOr(map, envKey);
  return { address, abi };
}

const rewardTreasury = contract("RewardTreasury", "NEXT_PUBLIC_REWARD_TREASURY_ADDRESS");
const pointsManager = contract("PointsManager", "NEXT_PUBLIC_POINTS_MANAGER_ADDRESS");
const activityRegistry = contract("ActivityRegistry", "NEXT_PUBLIC_ACTIVITY_REGISTRY_ADDRESS");
const spinRewardManager = contract("SpinRewardManager", "NEXT_PUBLIC_SPIN_REWARD_MANAGER_ADDRESS");

export const CONTRACTS = {
  ...(rewardTreasury ? { RewardTreasury: rewardTreasury } : {}),
  ...(pointsManager ? { PointsManager: pointsManager } : {}),
  ...(activityRegistry ? { ActivityRegistry: activityRegistry } : {}),
  ...(spinRewardManager ? { SpinRewardManager: spinRewardManager } : {}),
} as const;

export type ContractName = keyof typeof CONTRACTS;

/** True when a contract address is configured (env or synced mainnet deploy). */
export function isContractConfigured(name: ContractName): boolean {
  const c = CONTRACTS[name];
  return Boolean(c?.address && c.address !== ZERO_ADDRESS);
}
