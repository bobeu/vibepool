# API Route List — Vibepool 2.0

## Public / Read Routes

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| GET | /api/prediction | Current prediction round data | Scaffold |
| GET | /api/leaderboard | Daily / weekly rankings | Scaffold |
| GET | /api/missions | Daily missions list | Scaffold |
| GET | /api/spin | Available spins | Scaffold |
| GET | /api/reward | Claimable rewards | Scaffold |
| GET | /api/profile | User profile | Scaffold |
| GET | /api/activity | User activity log | Scaffold |
| GET | /api/notification | Notifications | Scaffold |

## Authenticated / Write Routes

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| POST | /api/prediction | Submit prediction | Scaffold |
| POST | /api/missions | Complete mission | Scaffold |
| POST | /api/spin | Execute spin | Scaffold |
| POST | /api/reward | Claim reward | Scaffold |
| PUT | /api/profile | Update profile | Scaffold |
| POST | /api/wallet | Wallet auth | Scaffold |

Notes:
- Rate limiting is implemented as an in-memory stub.
- Wallet address is expected via `x-wallet-address` header for authenticated routes.
- All routes return `501 Not Implemented` stubs in Prompt 1.
