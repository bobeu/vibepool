# Beta Go / No-Go Assessment — Prompt 18

**Date:** 2026-07-12  
**Scope:** Closed beta, 50–100 MiniPay users, off-chain rewards week 1  
**Decision:** **GO** — with documented mitigations

---

## Executive Summary

NEXORA has crossed from implementation to release candidate (Prompt 17). Prompt 18 operational artifacts are in place. Critical gameplay loops, auth spine, E2E smoke coverage, beta dashboard, and feature-flagged blockchain are sufficient for a **limited closed beta**.

---

## Major Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Wallet / MiniPay connect failures | Medium | High | Runbook §3; MINIPAY_QA manual; off-chain gameplay |
| Bundle size / slow TTI on mobile | Medium | Medium | PERFORMANCE_BASELINE; defer wallet lazy-load post-beta |
| Missing client crash telemetry | Medium | Medium | Server errors + feedback workflow |
| On-chain settlement misconfiguration | Low | High | Flag default **off**; BETA_CONFIGURATION |
| DB migration failure on deploy | Low | Critical | Backup + DEPLOYMENT_CHECKLIST |
| Arena/prediction completion blind spots | Medium | Medium | Weekly manual SQL; MONITORING_REVIEW gaps |
| No CI pipeline in repo | Medium | Medium | `release:check` manual gate |

---

## Rollback Criteria

Trigger rollback (Level 1–4 per OPERATIONAL_RUNBOOKS) if:

- Auth broken for > 1 hour (cannot sign in)
- Readiness check fails > 30 minutes
- Critical exploit (reward duplication, auth bypass)
- > 25% of active users report blocker (estimate from feedback + DAU)
- Unrecoverable DB corruption

**Preferred:** Feature-flag disable before full revert.

---

## Success Metrics (Beta Week 1–2)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Invited users onboarded | 50+ | Funnel `onboarding_complete` |
| First prediction rate | > 60% of onboarded | `first_prediction` / onboarding |
| First arena match | > 40% of onboarded | `first_arena_match` |
| D7 retention (subset) | > 20% | `d7_return` events |
| Critical bugs open | 0 at end of week 1 | BUG_TRIAGE |
| API errors (24h) | < 50/day after baseline | `apiFailures24h` |
| Settlement failures | ~0 (settlement off) | `settlementFailures` |
| E2E smoke | 16+ pass on staging | Playwright |

---

## Daily Monitoring Checklist

- [ ] Health live + ready green
- [ ] Beta dashboard reviewed (`/api/v1/admin/beta`)
- [ ] New feedback triaged (FEEDBACK_WORKFLOW)
- [ ] Critical/High bugs within SLA (BUG_TRIAGE)
- [ ] Community incident comms if needed
- [ ] No unexpected deploys without checklist

---

## Preconditions (Must Be True Before Invite Wave)

- [ ] Staging passes [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [ ] [STAGING_VALIDATION_REPORT.md](./STAGING_VALIDATION_REPORT.md) env vars set
- [ ] Admin wallets configured
- [ ] `enableBlockchainSettlement: false` verified in deployed build
- [ ] TEST_ACCOUNTS / invite codes ready
- [ ] On-call launch engineer named

---

## Sign-Off

| Decision | GO ☐ | NO-GO ☐ |
|----------|------|---------|
| Launch engineer | | |
| Product | | |
| Date | | |

**Recommended:** **GO** for closed beta invite cohort after staging checklist complete.

---

## Related Deliverables

- [POST_BETA_ACTION_PLAN.md](./POST_BETA_ACTION_PLAN.md)
- [BETA_CONFIGURATION.md](./BETA_CONFIGURATION.md)
- [KNOWN_ISSUES.md](../beta/KNOWN_ISSUES.md) (Prompt 18 review)
