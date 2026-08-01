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
  const fromRegistry = CONTRACTS.SpinEconomy?.address;
  if (fromRegistry && fromRegistry !== ZERO_ADDRESS) return fromRegistry as Address;
  return ZERO_ADDRESS;
}

export function getSpinPrizeVaultAddress(): Address {
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

/**
 * SpinConfig bubble/cap amounts are stored as 18-decimal human equivalents.
 * Scale into the selected asset's native units (e.g. USDC 6 decimals).
 */
export function scaleSpinAmountToAsset(amount18: bigint, asset: SpinPayAsset): bigint {
  const decimals = CELO_ASSETS[asset].decimals;
  if (decimals === 18) return amount18;
  if (decimals > 18) return amount18 * 10n ** BigInt(decimals - 18);
  const divisor = 10n ** BigInt(18 - decimals);
  return amount18 / divisor;
}

export { assetAddress, CELO_ASSETS };
export type { SpinPayAsset };
