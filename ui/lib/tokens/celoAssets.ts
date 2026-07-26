import type { Address } from "@/config/constants";
import { USDM_CELO, ZERO_ADDRESS } from "@/config/constants";

/** Celo mainnet payment/reward assets for Spin Hunt. */
export type SpinPayAsset = "CELO" | "USDm" | "USDC" | "USDT";

export const CELO_ASSETS: Record<
  SpinPayAsset,
  { address: Address; decimals: number; symbol: SpinPayAsset }
> = {
  CELO: { address: ZERO_ADDRESS, decimals: 18, symbol: "CELO" },
  USDm: { address: USDM_CELO, decimals: 18, symbol: "USDm" },
  USDC: {
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    decimals: 6,
    symbol: "USDC",
  },
  USDT: {
    address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    decimals: 6,
    symbol: "USDT",
  },
};

export function assetAddress(symbol: SpinPayAsset): Address {
  return CELO_ASSETS[symbol].address;
}

export function assetDecimals(symbol: SpinPayAsset): number {
  return CELO_ASSETS[symbol].decimals;
}

export function symbolFromAddress(address: string): SpinPayAsset | null {
  const lower = address.toLowerCase();
  if (lower === ZERO_ADDRESS.toLowerCase()) return "CELO";
  for (const [sym, meta] of Object.entries(CELO_ASSETS)) {
    if (meta.address.toLowerCase() === lower) return sym as SpinPayAsset;
  }
  return null;
}
