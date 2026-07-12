# Operational Runbooks — Prompt 18

Companion to [ROLLBACK_GUIDE.md](../beta/ROLLBACK_GUIDE.md). Use Level 1 rollback first; escalate only when needed.

---

## 1. Service Outage

**Symptoms:** 5xx on all routes, health checks fail, users cannot load app.

### Diagnosis

```bash
curl -s https://<staging>/api/health/live
curl -s https://<staging>/api/health/ready
curl -s -H "Authorization: Bearer <admin>" https://<staging>/api/v1/admin/health
```

### Response

1. Confirm hosting platform status (Vercel/Railway/etc.).
2. Check recent deploy — revert if correlated (see Failed Deployment).
3. Verify `DATABASE_URL` and Postgres connectivity.
4. Restart app process if single-instance hang suspected.
5. Post status in community channel within 15 minutes.

### Recovery

- [ ] `/api/health/live` → 200
- [ ] `/api/health/ready` → 200 (DB connected)
- [ ] Playwright smoke subset passes
- [ ] Beta dashboard shows normal error rate

---

## 2. Blockchain Outage

**Symptoms:** RPC timeouts, settlement failures, wallet read errors on Celo/Sepolia.

**Beta default:** On-chain settlement is **disabled** — most users unaffected.

### If settlement flag is OFF

1. Confirm `enableBlockchainSettlement: false` in deployed config.
2. Communicate: rewards remain off-chain; no action required.
3. Monitor `settlementFailures` on beta dashboard (should stay low).

### If settlement flag is ON (week 2+)

1. Pause: set `enableBlockchainSettlement: false` → redeploy.
2. Do not call `POST /api/settlement` or admin reward batch until RPC stable.
3. Inspect `pendingReward` rows in `FAILED` / `PROCESSING`.
4. Retry settlements after RPC recovery via admin tools.

---

## 3. Wallet Provider Issues

**Symptoms:** Connect button hangs, sign-in fails, MiniPay cannot open dApp.

### Diagnosis

- Browser console for WalletConnect / wagmi errors
- Verify `NEXT_PUBLIC_WALLETCONNECT_ID` is set
- Test on desktop browser vs MiniPay in-app browser
- Check Celo RPC: `NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API`

### Response

1. Clear site data / reconnect wallet (user-facing workaround).
2. If WalletConnect outage: post known-issue notice; no code deploy usually needed.
3. If RainbowKit/wagmi regression: revert last frontend deploy.
4. Track under **Wallet** category in feedback workflow.

---

## 4. Database Rollback

**Symptoms:** Migration broke schema, corrupt data, Prisma errors on all API routes.

### Prevention

- Always backup before `db:migrate` / `db:push` on staging/prod.
- Test migrations on staging clone first.

### Response

1. Stop traffic to app (maintenance mode or platform pause).
2. Restore Postgres from last snapshot.
3. Redeploy **previous** app commit if migration was forward-only.
4. Run `GET /api/health/ready` and integration tests against restored DB.

**Do not** run destructive rollback scripts without backup confirmation.

---

## 5. Failed Deployment

**Symptoms:** Build fails in CI, deploy succeeds but app crashes, partial rollout.

### Build failure

```bash
cd ui && bun run release:check
```

Fix TypeScript/Prisma errors locally before re-push.

### Runtime failure after deploy

1. Revert commit: `git revert HEAD` → push → redeploy.
2. Run [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) post-rollback section.
3. Document incident in bug tracker (severity High until resolved).

---

## 6. Reward Settlement Failures

**Symptoms:** `settlementFailures` rising, users report missing rewards, `pendingReward` stuck.

### Off-chain (beta week 1)

1. Check admin beta dashboard: `GET /api/v1/admin/beta`.
2. Query failed pending rewards in DB.
3. Manual retry via admin reward APIs if available.
4. If systemic: pause new reward grants; fix engine; backfill.

### On-chain (when enabled)

1. Disable `enableBlockchainSettlement` immediately.
2. Verify signer balance and nonce on Sepolia.
3. Reconcile failed txs before re-enabling.

---

## 7. Emergency Feature Disable

| Scenario | Action |
|----------|--------|
| Arena exploit | Admin feature flag or disable queue via settings |
| Prediction abuse | Pause tournament via admin LiveOps |
| Referral fraud spike | Tighten fraud thresholds in ReferralEngine config |
| Feed spam | Enable moderation queue; pause publish if needed |
| Any critical bug | Feature flag in `productionConfig.ts` + redeploy |

**Target:** Disable within 30 minutes of confirmed critical issue.

---

## 8. Incident Communication

### Severity → Communication

| Severity | Channel | Update cadence |
|----------|---------|----------------|
| Critical | Community + in-app banner | Every 30 min until resolved |
| High | Community post | Every 2 hours |
| Medium | Internal + changelog | Daily summary |
| Low | Internal only | Weekly |

### Template

```
[NEXORA Beta] Incident Update — <date/time UTC>

Status: Investigating | Identified | Monitoring | Resolved
Impact: <who/what is affected>
Workaround: <if any>
Next update: <time>
```

### Post-incident

- Root cause in internal doc within 48h
- Update KNOWN_ISSUES.md if user-visible
- Add regression test or smoke test if applicable

---

## Escalation

| Role | Responsibility |
|------|----------------|
| On-call launch engineer | First response, runbooks, rollback |
| Product | User comms, prioritization |
| Admin wallet holder | Admin API actions, feature flags in DB |
