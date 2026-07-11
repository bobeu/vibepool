# Dormant Module Disconnection Report — Prompt 15

**Date:** 2026-07-11

No files were deleted. The following runtime disconnections were applied:

## Disconnections Applied

| Module | Disconnection | Config Flag | File |
|--------|---------------|-------------|------|
| Legacy API routes | Return `410 DORMANT_ROUTE` with replacement URL | `enableLegacyStubRoutes: false` | `lib/api/helpers.ts`, 5 route files |
| Experimental rating strategies | Not registered at startup; on-demand via `get("elo")` | `enableExperimentalRatingStrategies: false` | `rating/RatingStrategyRegistry.ts` |
| PresenceChanged handler | EventBus subscription removed | `enablePresenceFeedSideEffects: false` | `serviceImpl.ts` |
| ProgressionEngine | Never wired (no change needed) | `enableProgressionEngineSnapshots: false` | — |
| MissionRuleEngine | Never wired (no change needed) | `enableMissionRuleEngine: false` | — |
| BlockchainService stub | Still throws (no API calls it) | `enableBlockchainServiceStub: false` | `serviceImpl.ts` |

## Bug Fix (Not Disconnection)

| Issue | Fix |
|-------|-----|
| Admin scheduler had no job handlers | Unified via `schedulerRegistry.ts` — admin + internal routes share registered singleton |
| `SchedulerService` used invalid permission `scheduler:run` | Fixed to `scheduler:execute` |

## Re-Enabling Dormant Systems

Edit `ui/lib/runtime/productionConfig.ts`:

```typescript
PRODUCTION_RUNTIME.enableLegacyStubRoutes = true;
PRODUCTION_RUNTIME.enableExperimentalRatingStrategies = true;
```

Or set `ARENA_RATING_STRATEGY=elo` for on-demand experimental rating without flag change.

## Not Disconnected (Remain Active)

All gameplay, social, arena, LiveOps, admin, and observability engines remain fully active. EventBus persistence, feed publishing, referral milestones, and arena match handlers unchanged.
