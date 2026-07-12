# Beta Configuration — Prompt 18

**Target:** 50–100 MiniPay users, off-chain rewards, week 1.

## Runtime Flags (`lib/runtime/productionConfig.ts`)

| Flag | Beta Setting | Category | Rationale |
|------|--------------|----------|-----------|
| `enableLegacyStubRoutes` | **Disabled** | Disabled | Dormant routes return 410 |
| `enableExperimentalRatingStrategies` | **Disabled** | Disabled | Use `simple` rating only |
| `enableProgressionEngineSnapshots` | **Disabled** | Internal only | Superseded by GamificationEngine |
| `enableMissionRuleEngine` | **Disabled** | Internal only | ProgressEngine hardcoded keys |
| `enablePresenceFeedSideEffects` | **Disabled** | Feature-flagged | No presence→feed side effects |
| `enableBlockchainServiceStub` | **Disabled** | Disabled | Real BlockchainSyncService path |
| `enableBlockchainSettlement` | **Disabled** | Feature-flagged | Enable week 2 after Sepolia validation |

## Environment-Driven Features

| Feature | Beta | Control |
|---------|------|---------|
| Wallet auth | **Enabled** | Always on |
| Off-chain predictions | **Enabled** | Default gameplay |
| On-chain predictions | **Disabled** | No PredictionManager address |
| On-chain settlement | **Disabled** | Flag + `BACKEND_SIGNER_PRIVATE_KEY` |
| Admin console | **Enabled** | `SUPER_ADMIN_WALLETS` |
| Scheduler CLEANUP | **Enabled** | Required for arena hygiene |
| Referral fraud signals | **Enabled** | Default thresholds |
| Experimental A/B flags | **Internal only** | Admin experiments API |

## Gameplay Systems (Enabled for Beta)

- Authentication (wallet sign-in)
- Predictions / tournaments / leaderboard
- Arena (queue, match, result)
- Missions, spins, rewards (off-chain)
- Referrals, friends, community, feed
- Seasons, live events, campaigns
- Profile, achievements

## Disabled / Deferred

- Blockchain settlement (week 2+)
- TrueSkill / Elo / Glicko rating
- Legacy API stubs
- Presence feed automation

## Emergency Disable

1. **Single feature:** Toggle flag in `productionConfig.ts` → redeploy
2. **Arena:** Feature flag in DB via admin feature-flags API
3. **Full gameplay pause:** Community announcement + disable new tournaments via admin

## Week 2 Toggle Checklist (Settlement)

- [ ] Sepolia treasury funded and tested
- [ ] `BACKEND_SIGNER_PRIVATE_KEY` in secure vault
- [ ] Set `enableBlockchainSettlement: true`
- [ ] Monitor `GET /api/v1/admin/beta` settlementFailures
- [ ] Rollback plan in OPERATIONAL_RUNBOOKS.md
