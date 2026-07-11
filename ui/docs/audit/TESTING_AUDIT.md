# Testing Audit — Prompt 15

## Test Inventory

| File | Tests | Scope | Status |
|------|-------|-------|--------|
| `admin.test.ts` | 8 | Permissions, metadata, LiveOps fixes | ✅ Pass |
| `arena.test.ts` | 11 | Arena full stack | ✅ Pass |
| `liveops.test.ts` | 9 | Seasons, flags, scheduler | ✅ Pass |
| `observability.test.ts` | 11 | Prompt 14 observability | ✅ Pass |
| `social.test.ts` | 21 | Social + achievements | ✅ Pass |
| `spin_reward.test.ts` | ~15 | Spin, wheel, rewards | ✅ Pass |
| `engines.test.ts` | ~20 | Tournament pipeline | ⚠️ XPRewardEngine syntax issue |
| `missions_activity.test.ts` | ~10 | Missions, activity | ⚠️ Mock gaps |
| `tournament.test.ts` | ~5 | Services | ✅ Pass |
| `blockchain.test.ts` | 4 | BlockchainSyncService | ✅ Pass |
| `frontend.test.tsx` | 5 | Component renders | ❌ Excluded from vitest |
| `smartContracts/test/*` | — | Hardhat | Separate runner |

## Core Regression (Prompt 15)

**39/39 passing** — admin, arena, liveops, observability

## Coverage

- Vitest v8 coverage configured but not run in this sprint
- Target from Prompt 14: 95%+ — **not yet measured globally**
- Engines tested in isolation with mocked Prisma (not integration)

## Gaps

| Gap | Priority |
|-----|----------|
| No API route integration tests | High |
| No E2E (Playwright/Cypress) | High |
| Admin app untested | Medium |
| `frontend.test.tsx` not in include glob | Medium |
| Legacy dormant routes untested | Low |
| Observability engine DB integration | Medium |

## Flaky Tests

None observed in core regression suite across 3 runs.

## Broken Tests (Pre-existing)

| File | Issue |
|------|-------|
| `engines.test.ts` | XPRewardEngine async/await syntax |
| `missions_activity.test.ts` | Mock user/mission relation incomplete |

**Not rewritten per Prompt 15 constraints** — documented only.

## Recommendations

1. Add `__tests__/**/*.test.tsx` to vitest include
2. Add smoke test script for critical API routes
3. Add Playwright E2E for: login → arena queue → mission claim
4. Run `bun test --coverage` before launch decision
