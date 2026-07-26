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
  buzzerTapBonus: number;
  musicTrackId: string | null;
  musicUrl: string | null;
  itemSlugs: string[];
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
