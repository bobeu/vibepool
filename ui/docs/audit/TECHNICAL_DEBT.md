# Technical Debt Report — Prompt 15

## Known Issues

| ID | Issue | Severity | Fix Risk |
|----|-------|----------|----------|
| TD-01 | Admin scheduler had no handlers (fixed Prompt 15) | Critical | Done |
| TD-02 | `scheduler:run` invalid permission (fixed) | High | Done |
| TD-03 | XPRewardEngine syntax error breaks engines.test.ts | Medium | Low |
| TD-04 | missions_activity.test.ts mock incomplete | Medium | Low |
| TD-05 | Duplicate SeasonEngine/WheelEngine instances | Medium | Medium |
| TD-06 | BlockchainService stub vs BlockchainSyncService split | High | High |
| TD-07 | 7 Prompt 2 stub service files unused | Low | None (keep) |

## Future Improvements

1. Unified engine registry with lifecycle management
2. OpenTelemetry export from Prompt 14 observability
3. Consolidate health check endpoints
4. SSO for admin console
5. Visual content editor
6. Real-time metrics WebSocket stream

## Refactoring Opportunities

| Area | Benefit |
|------|---------|
| Extract EventBus subscribers from serviceImpl | Testability |
| Shared Prisma query helpers for admin dashboard | Performance |
| Zod schemas for all API routes | Security/consistency |
| Single WheelEngine export from serviceImpl | State consistency |

## Deferred Architecture

- Event sourcing replay UI
- Multi-region deployment
- Redis cache layer
- Message queue for settlement

## Performance Opportunities

- Dynamic import wagmi on wallet pages only
- Batch EventBus handler DB calls in ArenaMatchCompleted
- Index additions (see DATABASE_AUDIT.md)
- Metric/telemetry retention TTL jobs

## Testing Gaps

- API integration tests
- E2E MiniPay flows
- Admin app test suite
- Coverage report automation in CI

## Security Observations

- Broad rate limiting not applied
- CSP headers not configured
- Admin API lacks IP allowlist option

## Intentionally Not Fixed (Prompt 15)

Per architecture freeze — documented only, no automatic fixes except low-risk items listed in DORMANT_DISCONNECTIONS.md.
