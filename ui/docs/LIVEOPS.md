# LiveOps Architecture

The LiveOps layer enables operators to run NEXORA without code deployments. Six engines power the system:

| Engine | Responsibility |
|--------|----------------|
| `SeasonEngine` | Season lifecycle and progression |
| `ContentEngine` | CMS blocks and dynamic hero |
| `FeatureFlagEngine` | Rollouts, whitelists, environment targeting |
| `LiveOpsEngine` | Dashboard, events, banners |
| `SchedulerEngine` | Deferred jobs with retries |
| `CampaignEngine` | Onboarding, retention, re-engagement campaigns |

## Admin architecture

- Player UI has **no admin controls**.
- Admin permissions live in `lib/admin/permissions.ts` with roles: Super Admin, Game Operator, Content Editor, Support, Analyst, Read Only.
- Auth resolves via `SUPER_ADMIN_WALLETS` / `ADMIN_WALLETS` env vars or `AdminPermission` table.
- Write APIs call `requireAdmin(wallet, permission)`.

## Feature flags

Supported targeting:

- Global enable/disable
- Percentage rollout (wallet hash)
- Whitelist
- MiniPay-only (`x-minipay: true` header)
- Environment list

Check flags: `GET /api/feature-flags?key=arena`

## Scheduler

`SchedulerEngine` supports:

- Job registration by type
- Idempotent scheduling via `idempotencyKey`
- Retry with exponential backoff
- Dead-letter on max retries

Built-in handlers:

- `SEASON_ROLLOVER`
- `CAMPAIGN_START` / `CAMPAIGN_END`
- `CLEANUP` (expire matches/queues, activate events/campaigns)

Run due jobs (admin): `POST /api/internal/scheduler/run`

## Banner & content pipeline

1. Operator creates `ContentBlock` or `Banner` via POST APIs.
2. `ContentEngine.getHeroBanner()` serves home hero dynamically.
3. `LiveOpsEngine.getBanners()` serves placement-targeted banners with dismiss tracking.

## LiveOps APIs

| Route | Methods | Access |
|-------|---------|--------|
| `/api/liveops` | GET | Admin dashboard |
| `/api/seasons` | GET, POST | Public read / admin write |
| `/api/feature-flags` | GET, POST | Public key check / admin list |
| `/api/content` | GET, POST | Public read / admin write |
| `/api/campaigns` | GET, POST | Public read / admin write |
| `/api/banners` | GET, POST | Public read / admin write |
| `/api/events` | GET, POST | Public read / admin write |

All routes mirrored under `/api/v1/...`.

## EventBus integration

Subscribers in `serviceImpl.ts` react to:

- `SeasonStarted`, `SeasonEnded`
- `FeatureFlagChanged`
- `CampaignStarted`, `CampaignCompleted`
- `BannerPublished`
- `LiveEventStarted`, `LiveEventEnded`

## Frontend

- `/events` — Event Center with live/upcoming events and active campaigns
- Home hero — fetched from `/api/content?hero=1`
- Arena — respects `arena` feature flag

## Arena improvements (Prompt 11 fixes)

- **RatingStrategyRegistry** — pluggable Elo/Glicko/TrueSkill strategies
- **ArenaStateMachine** — formal match lifecycle transitions
- **Replay compression** — gzip+base64 with checkpoints
- **QueueSimulator** — 10/100/1000/10000 player benchmarks
- **ArenaAnalytics** — queue time, rating diff, match duration metrics
- **API versioning** — `/api/v1/arena/*`

## Performance recommendations

- Feature flag cache TTL: 30s (already implemented).
- Batch scheduler job execution; cap at 20 jobs per tick.
- Use CDN for banner `imageUrl` assets.
- Partition `ScheduledJob` by status + `scheduledAt` index.

## Before Prompt 13

- Standalone admin app with dedicated auth.
- Visual campaign builder and banner editor.
- Real-time LiveOps dashboard with ArenaAnalytics charts.
- AnnouncementSchedule delivery via NotificationEngine.
