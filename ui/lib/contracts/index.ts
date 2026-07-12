/**
 * Contract registry — addresses synced from smartContracts/deployments via sync-data.js
 */

import addresses from "./addresses.json";
import abis from "./abis.json";
import type { Address } from "@/types";
import { ZERO_ADDRESS } from "@/config/constants";

type NetworkMap = Record<string, string>;
type ContractKey = keyof typeof addresses;

const CHAIN_IDS = [42220, 11142220] as const;

function pickAddress(map: NetworkMap | undefined): Address {
  if (!map) return ZERO_ADDRESS;
  for (const chainId of CHAIN_IDS) {
    const addr = map[String(chainId)];
    if (addr) return addr as Address;
  }
  const fallback = Object.values(map)[0];
  return (fallback ?? ZERO_ADDRESS) as Address;
}

function contract(name: ContractKey) {
  const map = addresses[name] as NetworkMap | undefined;
  const abi = abis[name as keyof typeof abis];
  if (!map || !abi || Object.keys(map).length === 0) return null;
  return { address: pickAddress(map), abi };
}

const rewardTreasury = contract("RewardTreasury");
const pointsManager = contract("PointsManager");
const activityRegistry = contract("ActivityRegistry");
const spinRewardManager = contract("SpinRewardManager");
const predictionManager = contract("PredictionManager");

export const CONTRACTS = {
  ...(rewardTreasury ? { RewardTreasury: rewardTreasury } : {}),
  ...(pointsManager ? { PointsManager: pointsManager } : {}),
  ...(activityRegistry ? { ActivityRegistry: activityRegistry } : {}),
  ...(spinRewardManager ? { SpinRewardManager: spinRewardManager } : {}),
  ...(predictionManager ? { PredictionManager: predictionManager } : {}),
} as const;

export type ContractName = keyof typeof CONTRACTS;
