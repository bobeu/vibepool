export type PublicBubble = {
  id: string;
  spawnAtMs: number;
  lifetimeMs: number;
  tapsRequired: number;
  x: number;
  pathSeed: number;
};

export type HuntPlan = {
  durationMs: number;
  bubbles: PublicBubble[];
};

export type HuntLoadout = {
  rpmMultiplier: number;
  wheelRpm?: number;
  speedShielderQty?: number;
  quickBuzzerQty?: number;
  buzzerTapBonus: number;
  musicTrackId: string | null;
  musicUrl: string | null;
  itemSlugs: string[];
  nextShielderPriceWei?: string;
  nextBuzzerPriceWei?: string;
};

export type HuntSession = {
  sessionId: string;
  cashEarnedWei: string;
  cashAsset: string;
  startedAt: string;
  expiresAt: string;
  rpm: number;
  plan: HuntPlan;
  loadout?: HuntLoadout;
};
