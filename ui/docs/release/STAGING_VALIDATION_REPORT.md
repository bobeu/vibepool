# Staging Validation Report — Prompt 18

**Date:** 2026-07-12  
**Environment:** Local validation (staging proxy)  
**Release commit baseline:** `643c431` (Prompt 17)

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Environment variables | ⚠️ Partial | Documented below; staging must set all required vars |
| Database | ✅ Schema ready | Prisma 7, output `./generated` |
| Seed data | ✅ | `prisma/seed.ts` available |
| Smart contracts | ✅ Sepolia | Chain `11142220` synced in `addresses.json` |
| Feature flags | ✅ | All beta flags default **off** (safe) |
| Scheduler jobs | ✅ | SEASON_ROLLOVER, CAMPAIGN_*, CLEANUP registered |
| Telemetry | ✅ | Beta events + TelemetryEngine |
| Alert rules | ⚠️ Manual | Seed via admin API post-deploy |
| Health endpoints | ✅ | live, ready, startup, internal |
| Build | ✅ | `bun run build` passes |
| Integration tests | ✅ | 7/7 pass |
| Playwright E2E | ✅ | 16/17 pass (prod server) |

**Staging verdict:** Ready for deploy after env + DB provisioning.

---

## Environment Variables

### Required (staging)

| Variable | Purpose | Validated |
|----------|---------|-----------|
| `DATABASE_URL` | PostgreSQL | Required for readiness |
| `NEXT_PUBLIC_APP_URL` | Invite/deep links | Used by InviteEngine, QR |
| `NEXT_PUBLIC_WALLETCONNECT_ID` | WalletConnect | RainbowKit |

### Recommended

| Variable | Purpose |
|----------|---------|
| `SUPER_ADMIN_WALLETS` / `ADMIN_WALLETS` | Admin console access |
| `NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API` | Celo RPC |
| `APP_VERSION` | Health/logging |
| `ARENA_RATING_STRATEGY` | Default `simple` |

### Beta-off (do not enable week 1)

| Variable | Purpose |
|----------|---------|
| `BACKEND_SIGNER_PRIVATE_KEY` | On-chain settlement only |

---

## Database

- Generate client: `bun run db:generate`
- Apply schema: `bun run db:push` or migrate
- Seed: `bunx prisma db seed` (if configured)
- Hot indexes: userProfile.wallet, session.refreshToken, pendingReward.status

---

## Smart Contracts (Sepolia 11142220)

| Contract | Address |
|----------|---------|
| RewardTreasury | `0x3073792CB872D5194a35777beF82561ad4C07300` |
| PointsManager | `0xDA5Fbd3f5F42fb0c65b7d27cb99f191ba0fbF91a` |
| SpinRewardManager | `0x94943AD6604FeDDD45597441B277A3ECdFC3299E` |
| ActivityRegistry | `0x3e380A0d364358519BC3847d996bc5a17d9Bf268` |

PredictionManager: not deployed (off-chain predictions for beta).

---

## Feature Flags (see BETA_CONFIGURATION.md)

All `PRODUCTION_RUNTIME` flags default **false** — correct for closed beta.

---

## Scheduler Jobs (Beta)

| Job | Handler | Beta |
|-----|---------|------|
| `CLEANUP` | Expire matches/queues, activate campaigns/events | **Enable** |
| `SEASON_ROLLOVER` | Season transitions | Enable if active season |
| `CAMPAIGN_START` / `CAMPAIGN_END` | LiveOps | As scheduled |

Verify via `GET /api/v1/admin/scheduler` — no dead-letter backlog.

---

## Telemetry & Alerts

- Beta funnel: `lib/telemetry/betaEvents.ts` → `telemetryEvent` table
- Dashboard: `GET /api/v1/admin/beta`
- Post-deploy: seed alert rules (arena queue, settlement backlog, dead letter)

---

## Validation Commands

```bash
cd ui
bun run release:check          # generate + integration + build
bun run start                # production server
PLAYWRIGHT_SKIP_WEBSERVER=1 bun run test:e2e
curl http://localhost:3001/api/health/live
curl http://localhost:3001/api/health/ready
```
