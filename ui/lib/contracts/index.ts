/**
 * Contract registry — Celo mainnet (42220) only.
 * Source of truth: addresses.json + abis.json from `bun run sync` in smartContracts.
 */

import addresses from "./addresses.json";
import abis from "./abis.json";
import type { Address } from "@/types";
import { ZERO_ADDRESS } from "@/config/constants";

const MAINNET_CHAIN_ID = "42220";

type NetworkMap = Record<string, string>;
type ContractKey =
  | "RewardTreasury"
  | "PointsManager"
  | "ActivityRegistry"
  | "SpinRewardManager"
  | "SpinPrizeVault"
  | "SpinEconomy";

function mainnetAddress(map: NetworkMap | undefined): Address {
  const addr = map?.[MAINNET_CHAIN_ID];
  if (addr && addr.startsWith("0x") && addr.length === 42) return addr as Address;
  return ZERO_ADDRESS;
}

function contract(name: ContractKey): { address: Address; abi: unknown } | null {
  const abi = abis[name as keyof typeof abis];
  if (!abi) return null;
  const address = mainnetAddress(addresses[name] as NetworkMap | undefined);
  return { address, abi };
}

const rewardTreasury = contract("RewardTreasury");
const pointsManager = contract("PointsManager");
const activityRegistry = contract("ActivityRegistry");
const spinRewardManager = contract("SpinRewardManager");
const spinPrizeVault = contract("SpinPrizeVault");
const spinEconomy = contract("SpinEconomy");

export const CONTRACTS = {
  ...(rewardTreasury ? { RewardTreasury: rewardTreasury } : {}),
  ...(pointsManager ? { PointsManager: pointsManager } : {}),
  ...(activityRegistry ? { ActivityRegistry: activityRegistry } : {}),
  ...(spinRewardManager ? { SpinRewardManager: spinRewardManager } : {}),
  ...(spinPrizeVault ? { SpinPrizeVault: spinPrizeVault } : {}),
  ...(spinEconomy ? { SpinEconomy: spinEconomy } : {}),
} as const;

export type ContractName = keyof typeof CONTRACTS;

/** True when a synced mainnet address is present in addresses.json. */
export function isContractConfigured(name: ContractName): boolean {
  const c = CONTRACTS[name];
  return Boolean(c?.address && c.address !== ZERO_ADDRESS);
}

/** Address from the synced registry, or zero if missing. */
export function getContractAddress(name: ContractKey): Address {
  return mainnetAddress(addresses[name] as NetworkMap | undefined);
}
