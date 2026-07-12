# Monitoring Review — Prompt 18

Review of existing observability for closed beta. **No new analytics systems** — document gaps and manual compensations.

---

## Dashboards & APIs

| Source | Endpoint / location | Access |
|--------|---------------------|--------|
| Beta dashboard | `GET /api/v1/admin/beta` | Admin JWT |
| Admin health | `GET /api/v1/admin/health` | Admin JWT |
| Admin metrics | `GET /api/v1/admin/metrics` | Admin JWT |
| Liveness | `GET /api/health/live` | Public |
| Readiness | `GET /api/health/ready` | Public |
| Internal health | `GET /api/internal/health` | Internal |
| Observability docs | [OBSERVABILITY.md](../OBSERVABILITY.md) | — |

---

## Required Metrics vs Coverage

| Metric | Required for beta | Current coverage | Gap / workaround |
|--------|-------------------|------------------|------------------|
| Daily active beta users | Yes | `activeBetaUsers` (7d login count) | Not true DAU — use daily manual count or divide by 7 for estimate |
| Crash rate | Yes | `crashes` / `apiFailures24h` (audit log ERROR count) | Not client crash SDK — rely on user reports + server errors |
| API errors | Yes | `apiFailures24h` | ✅ |
| Wallet failures | Yes | Partial — login failures in audit if logged | Tag wallet issues in triage; no dedicated metric |
| Arena completion rate | Yes | **Gap** — funnel has `first_arena_match` only | Compare queue joins vs results manually; add post-beta metric |
| Prediction completion rate | Yes | **Gap** — funnel has `first_prediction` only | Admin tournament stats or manual SQL |
| Reward claim success | Yes | `settlementFailures`, `failedTransactions` | ✅ for failures; success = inverse estimate |
| Session duration | Yes | `averageSessionMinutes` | Proxy via session expiry − createdAt |
| Retention | Yes | `betaFunnel` d1/d3/d7_return events | ✅ via `trackRetentionOnLogin` |

---

## Beta Funnel Events (`lib/telemetry/betaEvents.ts`)

| Event | Meaning |
|-------|---------|
| `onboarding_complete` | First-time setup done |
| `first_prediction` | First prediction submitted |
| `first_arena_match` | First arena match completed |
| `first_spin` | First spin |
| `first_reward_claim` | First reward claimed |
| `first_referral` | First referral action |
| `d1_return` / `d3_return` / `d7_return` | Retention milestones |

Query via beta dashboard `betaFunnel` object.

---

## Alert Rules

**Status:** Not auto-seeded in all environments.

Post-deploy actions:

1. Seed alert rules via admin API (arena queue depth, settlement backlog, scheduler dead letter).
2. Document thresholds in ops channel.
3. On-call checks beta dashboard 2× daily during beta week 1.

---

## Daily Monitoring Checklist

Use with [BETA_GO_NO_GO.md](./BETA_GO_NO_GO.md).

- [ ] `GET /api/health/ready` green
- [ ] `activeBetaUsers` trending (not zero if invites sent)
- [ ] `apiFailures24h` < 50 (adjust threshold after baseline week)
- [ ] `settlementFailures` stable (expect 0 with settlement off)
- [ ] `topReportedIssues` reviewed and triaged
- [ ] `betaFunnel` — onboarding → first_prediction conversion
- [ ] No open Critical bugs > 4h
- [ ] Hosting CPU/memory within platform limits (manual)

---

## Gaps (Accept for Beta)

| Gap | Risk | Mitigation |
|-----|------|------------|
| No client crash reporting | Medium | User feedback + server 5xx |
| No true DAU metric | Low | Weekly active + funnel |
| Arena/prediction completion rates | Medium | Manual SQL weekly |
| API P95 latency | Low | Log review if users report slowness |
| LCP / TTI on MiniPay | Medium | MINIPAY_QA manual passes |

**Post-beta:** Add completion-rate queries to AdminDashboardEngine without new infrastructure.

---

## Related Docs

- [PERFORMANCE_BASELINE.md](./PERFORMANCE_BASELINE.md)
- [STAGING_VALIDATION_REPORT.md](./STAGING_VALIDATION_REPORT.md)
- [PERFORMANCE_AUDIT.md](../audit/PERFORMANCE_AUDIT.md)
