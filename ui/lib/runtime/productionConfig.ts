/**
 * Production runtime flags — Prompt 15 architecture freeze.
 * Dormant modules remain in the repo but skip runtime initialization when disabled.
 */
export const PRODUCTION_RUNTIME = {
  /** Legacy singular API routes (/api/spin, /api/reward, etc.) */
  enableLegacyStubRoutes: false,
  /** Experimental rating algorithms (elo, glicko, trueskill) — use simple only at launch */
  enableExperimentalRatingStrategies: false,
  /** ProgressionEngine snapshot/delta system (superseded by GamificationEngine) */
  enableProgressionEngineSnapshots: false,
  /** MissionRuleEngine dynamic rule matching (ProgressEngine uses hardcoded keys) */
  enableMissionRuleEngine: false,
  /** PresenceChanged → feed side effects (currently no-op) */
  enablePresenceFeedSideEffects: false,
  /** BlockchainService stub in serviceImpl (real sync lives in BlockchainSyncService) */
  enableBlockchainServiceStub: false,
} as const;

export type ProductionRuntimeFlag = keyof typeof PRODUCTION_RUNTIME;

export function isRuntimeEnabled(flag: ProductionRuntimeFlag): boolean {
  return PRODUCTION_RUNTIME[flag];
}
