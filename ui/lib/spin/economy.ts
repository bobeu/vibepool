import { parseEther, parseUnits } from "viem";
import { celo } from "viem/chains";
import { ZERO_ADDRESS, type Address } from "@/config/constants";
import {
  CELO_ASSETS,
  type SpinPayAsset,
  assetAddress,
} from "@/lib/tokens/celoAssets";
import { CONTRACTS } from "@/lib/contracts";

/** Default entry fees when SpinConfig is not seeded. */
export const DEFAULT_ENTRY_FEES: Record<SpinPayAsset, bigint> = {
  CELO: parseEther("0.05"),
  USDm: parseEther("0.01"),
  USDC: parseUnits("0.01", 6),
  USDT: parseUnits("0.01", 6),
};

export function getSpinEconomyAddress(): Address {
  const fromEnv = process.env.NEXT_PUBLIC_SPIN_ECONOMY_ADDRESS?.trim();
  if (fromEnv && fromEnv.startsWith("0x") && fromEnv.length === 42) {
    return fromEnv as Address;
  }
  const fromRegistry = CONTRACTS.SpinEconomy?.address;
  if (fromRegistry && fromRegistry !== ZERO_ADDRESS) return fromRegistry as Address;
  return ZERO_ADDRESS;
}

export function getSpinPrizeVaultAddress(): Address {
  const fromEnv = process.env.NEXT_PUBLIC_SPIN_PRIZE_VAULT_ADDRESS?.trim();
  if (fromEnv && fromEnv.startsWith("0x") && fromEnv.length === 42) {
    return fromEnv as Address;
  }
  const fromRegistry = CONTRACTS.SpinPrizeVault?.address;
  if (fromRegistry && fromRegistry !== ZERO_ADDRESS) return fromRegistry as Address;
  return ZERO_ADDRESS;
}

export function getSpinHuntChainId(): number {
  return celo.id;
}

export function preferredEntryAsset(isMiniPay: boolean): SpinPayAsset {
  return isMiniPay ? "USDm" : "CELO";
}

export function defaultEntryFee(asset: SpinPayAsset): bigint {
  return DEFAULT_ENTRY_FEES[asset];
}

export function isSpinPayAsset(value: string): value is SpinPayAsset {
  return value in CELO_ASSETS;
}

export { assetAddress, CELO_ASSETS };
export type { SpinPayAsset };
