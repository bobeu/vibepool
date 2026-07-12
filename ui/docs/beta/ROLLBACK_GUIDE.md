# Rollback Guide — Closed Beta

## Level 1: Feature Flag Rollback (preferred)

Disable in `lib/runtime/productionConfig.ts` or env override:

| Flag | Effect |
|------|--------|
| `enableBlockchainSettlement: false` | Revert to mock/off-chain settlement |
| `enableLegacyStubRoutes: false` | Keep dormant routes off |
| `enablePresenceFeedSideEffects: false` | Disable presence feed side effects |

Redeploy UI — no database migration required.

## Level 2: Settlement Pause

1. Stop processing via admin: do not call `POST /api/v1/admin/rewards`
2. Pending rewards remain in `PENDING` status
3. Notify users via community post

## Level 3: Auth Spine Rollback

If auth is broken:

1. Revert to last known good commit on `main`
2. Verify `GET /api/auth/session` returns 401 without token
3. Verify wallet login flow on MiniPay

## Level 4: Full Deploy Rollback

```bash
git revert HEAD
git push origin main
# redeploy from CI
```

## Post-Rollback Checklist

- [ ] Smoke tests pass (`bun run test:e2e`)
- [ ] Admin health check green (`GET /api/v1/admin/health`)
- [ ] No elevated error rate in beta dashboard
