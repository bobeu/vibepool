# Feature Completion — Prompt 16

## Production Ready

- Wallet authentication with signed message + Bearer session
- Arena full loop (queue → match → result → replay)
- Season progress display
- Community announcements
- Friends / referrals / invites
- Admin console + observability

## Completed This Sprint

| Feature | Before | After |
|---------|--------|-------|
| Auth spine | Broken middleware, no session route | Full wallet → session flow |
| Predictions | Placeholder page | Submit UI + API |
| Missions | Claim mutation unused | Claim button wired |
| Rewards | Read-only | Claim button wired |
| Leaderboard | Field mismatch | API normalized |
| Services | Static calls + wallet as userId | Instances + resolveUserId |

## Partial

| Feature | Gap |
|---------|-----|
| Achievements | No bottom-nav link; profile subset only |
| Feed | Profile link only |
| Referrals | Profile link only |
| Missions/Rewards | HomeHub links only |
| Tournament UI | Filters UPCOMING/COMPLETED — now API returns all |
| On-chain rewards | BlockchainService stub |

## Placeholder (Intentionally Deferred)

- TrueSkill rating strategy
- BlockchainService in serviceImpl
- `/api/invites/qr` route
