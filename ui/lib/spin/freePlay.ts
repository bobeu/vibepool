import { isGuestWallet } from "@/lib/auth/guest";

/** Max spins granted to a normal free-play (guest) session. */
export const FREEPLAY_MAX_SPINS = 5;

/** Max one-time welcome spins for connected (pay-mode) wallets. */
export const PAY_MODE_MAX_WELCOME_SPINS = 3;

/** Spins restored when an allowed tester refills. */
export const FREEPLAY_REFILL_SPINS = 5;

/**
 * Connected wallets allowed unlimited free-mode style refill
 * (demo / admin testers). Lowercased for comparison.
 */
export const UNLIMITED_FREEPLAY_WALLETS = [
  "0xb2adb77a837d19c3ada396db74483b05d49ad6b7",
  "0xa1f70ffa4322e3609dd905b41f17bf3913366bc1",
] as const;

export function isUnlimitedFreeplayWallet(wallet: string | null | undefined): boolean {
  if (!wallet) return false;
  return UNLIMITED_FREEPLAY_WALLETS.includes(
    wallet.toLowerCase() as (typeof UNLIMITED_FREEPLAY_WALLETS)[number]
  );
}

/** Who may refill / buy demo spin packs. Guests cannot; only listed wallets. */
export function canRefillOrBuyDemoSpins(wallet: string): boolean {
  return isUnlimitedFreeplayWallet(wallet);
}

/** Mock catalog prices shown in free-play shop (not charged on-chain). */
export const FREEPLAY_SPIN_PACKS = [
  { id: "pack3", spins: 3, label: "+3 Spins", mockPrice: "0.01 USDm" },
  { id: "pack10", spins: 10, label: "+10 Spins", mockPrice: "0.03 USDm" },
] as const;

export type FreePlaySpinPackId = (typeof FREEPLAY_SPIN_PACKS)[number]["id"];

export function spinPackById(id: string) {
  return FREEPLAY_SPIN_PACKS.find((p) => p.id === id) ?? null;
}

export const MOCK_CREDIT_TX = "0xmockfreeplay0000000000000000000000000000000000000000000000000001";
export const MOCK_WITHDRAW_TX = "0xmockfreeplaywithdraw000000000000000000000000000000000000000001";

export function isFreePlayGuestWallet(wallet: string): boolean {
  return isGuestWallet(wallet);
}
