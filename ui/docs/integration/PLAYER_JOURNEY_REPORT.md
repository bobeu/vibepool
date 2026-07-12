# Player Journey Report — Prompt 16

## Authentication ✅

Connect wallet → sign message → `POST /api/auth/login` → token stored → `GET /api/auth/session` → authenticated API calls via `authFetch`.

## Prediction ✅

Open `/prediction` → load tournament → submit value → `POST /api/predictions` → activity recorded.

## Arena ✅

Queue → match → submit → result → rating update → replay (most complete journey).

## Missions ✅

Load missions → progress via EventBus → claim when complete → `POST /api/missions`.

## Spins ✅

View balance → spin → reward via WheelEngine (requires auth + userId resolution).

## Rewards ✅

List claimable → claim points → `POST /api/rewards`.

## Referrals ✅

Generate invite → redeem on login → milestones via EventBus.

## Community ✅

Read posts → create post (auth required).

## Seasons ✅

View active season → progress from arena XP events.

## Known Journey Gaps

| Journey | Issue | Severity |
|---------|-------|----------|
| Prediction → XP → Leaderboard | Evaluation requires admin/tournament lock | Medium |
| Rewards → on-chain claim | No blockchain API | High (deferred) |
| Achievement unlock animation | Requires achievement POST + EventBus | Low |

## Recommendation

**Ready for Closed Beta** for off-chain gameplay loops after auth fix verification on MiniPay device.
