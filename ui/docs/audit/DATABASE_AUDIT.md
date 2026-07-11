# Database Audit — Prompt 15

**ORM:** Prisma 7.4 + PostgreSQL  
**Schema file:** `ui/prisma/schema.prisma` (~2000 lines, 80+ models)

## Index Coverage (Strong)

Well-indexed models:
- `AuditLog` — action, entity, correlationId, recordHash
- `MetricSeries` — name + recordedAt
- `TelemetryEvent` — source, traceId, correlationId
- `ArenaQueue`, `ArenaMatch` — status + timestamps
- `ScheduledJob` — status + scheduledAt
- `UserProfile` — wallet (unique)

## Index Gaps (Recommendations)

| Model | Suggested Index | Reason |
|-------|-----------------|--------|
| `FeedItem` | `[userId, createdAt]` | Feed pagination |
| `Notification` | `[userId, read, createdAt]` | Unread queries |
| `PendingReward` | `[status, createdAt]` | Settlement queue |
| `SpinHistory` | `[userId, createdAt]` | History pages |

**Not applied in Prompt 15** — document only, requires migration review.

## Relations

- Foreign keys generally use `onDelete: Cascade` for child records
- Arena participants → match (correct)
- Campaign versions → campaign (correct)

## Query Patterns

| Pattern | Risk | Location |
|---------|------|----------|
| N+1 in EventBus handlers | Medium | ArenaMatchCompleted (per-player DB calls) |
| Unbounded `findMany` | Low | Admin list endpoints use `take` |
| Count-heavy dashboard | Medium | AdminDashboardEngine (14 parallel counts) |

## Transactions

- Settlement and match finalization should use transactions — verify `ResultEngine.finalizeMatch`
- Audit hash chain: sequential writes (append-only, not transactional with business ops)

## Migration Consistency

- Schema extended through Prompts 11–14 without destructive migrations
- **Action required pre-launch:** Run `bun run db:push` or `db:migrate` against production DB

## Connection Usage

- Single Prisma client via `lib/auth/session.ts`
- No connection pool tuning documented — **recommend** `connection_limit` for production

## Observability Tables (Prompt 14)

New time-series tables (`MetricSeries`, `TelemetryEvent`, `SystemHealth`) need retention policy before scale — see TECHNICAL_DEBT.md.

## Prisma Generate

Requires `DATABASE_URL` env var. Generated client in `ui/generated/`.
