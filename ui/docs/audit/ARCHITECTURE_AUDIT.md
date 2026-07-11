# Architecture Audit — Prompt 15

**Date:** 2026-07-11  
**Status:** Architecture frozen for MiniPay launch

## Summary

NEXORA is a Next.js 15 monorepo with two deployable apps:

| App | Port | Role |
|-----|------|------|
| `ui/` | 3001 | Player API + frontend |
| `apps/admin/` | 3002 | Operations console (API client only) |

Core pattern: **Engines → Services (serviceImpl) → API routes → Pages**

## Active Modules (Production Flow)

| Layer | Modules |
|-------|---------|
| Auth | Wallet signature login, JWT sessions, refresh tokens |
| Gameplay | Predictions, tournaments, leaderboard, missions, spin, rewards |
| Arena | Matchmaking, match lifecycle, rating, spectator, replay |
| Social | Friends, referrals, feed, presence, community, invites |
| Progression | Gamification, achievements, badges, titles, streaks |
| LiveOps | Seasons, campaigns, feature flags, content, events, banners |
| Admin | Dashboard, moderation, arena ops, observability |
| Observability | Metrics, alerts, traces, insights, health checks |

## Dormant Modules

| Module | Reason | References | Future Purpose |
|--------|--------|------------|----------------|
| `ProgressionEngine` | Superseded by `GamificationEngine` | Tests only | Snapshot-based progression v2 |
| `MissionRuleEngine` | Not wired to `ProgressEngine` | Tests only | Dynamic mission rule DSL |
| `BlockchainService` (serviceImpl stub) | Throws; real sync in `BlockchainSyncService` | Interface only | On-chain read/write API |
| Prompt 2 stub services (`WalletService`, etc.) | Superseded by serviceImpl | Zero imports | Historical |
| Legacy API routes (`/api/spin`, etc.) | Superseded by plural routes | Route files | Backward compat |
| Experimental rating (elo/glicko/trueskill) | Lazy-loaded on demand | Arena tests | A/B rating algorithms |
| `PresenceChanged` EventBus handler | Disconnected at launch | serviceImpl | Presence feed updates |

## Experimental Modules

| Module | Notes |
|--------|-------|
| `EloRatingStrategy`, `GlickoRatingStrategy`, `TrueSkillRatingStrategy` | On-demand registration |
| `ExperimentAnalyticsEngine` | A/B/C experiment comparison |
| `AnomalyEngine` | Statistical anomaly detection |
| `GlobalSearchEngine` | Admin universal search |
| `BlockchainSyncService` | Tested, no API route |

## Dead Code (Not Deleted — Report Only)

| Item | Location | Action |
|------|----------|--------|
| Duplicate `WheelEngine` instances | `spins/route.ts`, `spin/history/route.ts` | TODO: reuse serviceImpl singleton |
| Duplicate `SeasonEngine` | `SeasonEngine.ts` export + serviceImpl | TODO: unify singleton |
| `frontend.test.tsx` | Excluded from vitest include | TODO: add to test runner |
| 7 Prompt 2 service stubs | `ui/services/*.ts` | LEGACY — do not import |

## Dependency Graph Highlights

```
pages → API routes → serviceImpl → engines → prisma
                  ↘ admin engines (direct)
EventBus ← engines (publish)
EventBus → serviceImpl subscribers (28 handlers)
schedulerRegistry → SchedulerEngine → job handlers
```

### Circular Dependencies

None detected at module level. `serviceImpl` imports `schedulerRegistry` which imports engines independently.

### Layer Violations

| Issue | Severity |
|-------|----------|
| Admin routes instantiate engines directly | Low — acceptable for admin isolation |
| Profile engines per-route instantiation | Low — lazy init pattern |
| `ArenaEngine` imports `seasonEngine` singleton | Medium — duplicate instance risk |

## Runtime Configuration

`ui/lib/runtime/productionConfig.ts` — feature flags for dormant system disconnection.

## Recommendations (Deferred)

1. Extract EventBus subscriptions to named modules for testability
2. Single engine registry with explicit ACTIVE/DORMANT status
3. Wire `BlockchainSyncService` to API when on-chain launch ready
4. Consolidate health endpoints (`/api/health/*` vs `/api/internal/*`)
