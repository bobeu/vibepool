# Prisma — Vibepool 2.0

Database schema is **not implemented in Phase 1 Prompt 1**.

## Planned entities (high level — Prompt 2)

| Entity | Purpose |
|--------|---------|
| `UserProfile` | Wallet identity, username, avatar, XP, level |
| `MissionProgress` | Daily mission completion state |
| `LeaderboardSnapshot` | Cached daily rankings |
| `ActivityLog` | User actions for analytics |
| `SpinHistory` | Spin outcomes |

Run `npx prisma init` and define schema in Prompt 2.
