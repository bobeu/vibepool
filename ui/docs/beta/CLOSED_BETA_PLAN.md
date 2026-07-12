# Closed Beta Plan — NEXORA

## Timeline

| Phase | Duration | Goal |
|-------|----------|------|
| Week 1 | Days 1–7 | 50 MiniPay testers, core loop validation |
| Week 2 | Days 8–14 | Scale to 100 users, settlement + retention review |

## Cohort

- MiniPay embedded browser on Celo
- Low-end Android devices (primary)
- Wallet-required for authenticated gameplay

## Success Metrics

- ≥70% onboarding completion (wallet connect + first session)
- ≥40% first prediction within 24h
- ≥25% D1 return
- <2% API error rate (24h rolling)
- Zero broken navigation paths

## Daily Ops

1. Review `/api/v1/admin/beta` dashboard
2. Triage `KNOWN_ISSUES.md` entries
3. Run `bun run test:e2e` smoke suite
4. Process pending settlements via admin rewards route

## Rollback Trigger

- Settlement failure rate >5% in 1 hour
- Auth spine outage >15 minutes
- Critical data integrity issue

See `ROLLBACK_GUIDE.md` for procedures.
