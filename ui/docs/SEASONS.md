# Seasons Architecture

NEXORA seasons are managed by `SeasonEngine` and stored in normalized Prisma models (`Season`, `SeasonTier`, `SeasonReward`, `SeasonMission`, `SeasonLeaderboard`, `SeasonProgress`).

## Lifecycle

- **PRESEASON** → **ACTIVE** → **ENDED** → **ARCHIVED**
- Only one season may be `ACTIVE` at a time.
- `activateSeason()` ends any current active season before activating the next.
- `rollover()` ends the active season when `endAt` has passed and activates the next preseason season if present.

## Player progression

- **Season XP** is awarded on arena match completion (win: 50 XP, loss: 15 XP).
- **Tier level** is derived from `SeasonTier.xpRequired` thresholds.
- Arena ratings and season statistics remain keyed by `seasonNumber` for soft resets between seasons.

## APIs

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/seasons` | Active season + authenticated user progress |
| POST | `/api/seasons` | Create season (admin) |
| POST | `/api/seasons` `{ action: "activate" }` | Activate season (admin) |

Versioned mirrors live under `/api/v1/seasons`.

## Events

- `SeasonStarted` — published on activation; feed announcement.
- `SeasonEnded` — published on rollover.

## Frontend

- `/season` — season pass, progress bar, tier rewards, countdown to season end.

## Performance recommendations

- Cache active season number in memory with short TTL (30s) to reduce DB reads in matchmaking hot paths.
- Precompute tier thresholds when seasons are created.
- Index `Season.status` and `Season.number` for fast lookups.

## Before Prompt 13

- Add admin console UI for season CRUD and rollover scheduling.
- Wire season missions to `MissionEngine` with `SEASONAL` category.
- Snapshot leaderboards on season end via scheduler jobs.
