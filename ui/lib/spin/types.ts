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

export type HuntSession = {
  sessionId: string;
  cashEarnedWei: string;
  cashAsset: string;
  startedAt: string;
  expiresAt: string;
  rpm: number;
  plan: HuntPlan;
};
