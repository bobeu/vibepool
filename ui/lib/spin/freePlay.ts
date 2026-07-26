/** Mock catalog prices shown to free-play testers (not charged on-chain). */
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
