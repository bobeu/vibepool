# Blockers — Prompt 16

| ID | Severity | Feature | Issue | Fix | Effort |
|----|----------|---------|-------|-----|--------|
| B-01 | Critical | Auth | Was broken (async middleware, schema drift) | **Fixed Prompt 16** | Done |
| B-02 | Critical | All authenticated APIs | Static service calls | **Fixed Prompt 16** | Done |
| B-03 | High | Missions/Spins/Rewards | wallet passed as userId | **Fixed resolveUserId** | Done |
| B-04 | High | Blockchain | No settlement API | Wire BlockchainSyncService | 3–5 days |
| B-05 | Medium | E2E | No Playwright tests | Add smoke suite | 2 days |
| B-06 | Medium | Nav | Missions/Achievements/Feed hidden | Add nav or profile hub | 0.5 day |
| B-07 | Medium | Invites | QR route missing | Add `/api/invites/qr` or remove button | 0.5 day |
| B-08 | Low | EventBus | Orphan events | Add subscribers or document | 1 day |
| B-09 | Low | engines.test.ts | XPRewardEngine syntax | Fix async function | 0.5 day |
| B-10 | Low | Assets | Manifest paths may 404 | Asset deploy check | 1 day |

## Closed Beta Verdict

**Ready for Closed Beta** — off-chain gameplay with wallet auth.

**Not ready for public launch** — blockchain settlement, E2E automation, mobile UX polish.
