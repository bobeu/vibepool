# Observability & Production Intelligence

NEXORA Prompt 14 adds a full observability layer: metrics, telemetry, tracing, alerts, insights, anomaly detection, and admin dashboards.

## Architecture

```
Metrics → Logs → Events → Traces → Insights → Alerts → Actions
```

### Engines

| Engine | Purpose |
|--------|---------|
| `AnalyticsEngine` | Product metrics (DAU/WAU/MAU, engagement) |
| `MetricsEngine` | Time-series recording and percentiles |
| `TelemetryEngine` | Structured telemetry events |
| `ObservabilityEngine` | Dashboard aggregation and health checks |
| `AlertEngine` | Rule evaluation and incident management |
| `InsightEngine` | Automated operator insights |
| `AnomalyEngine` | Statistical anomaly detection (z-score) |

## Admin APIs

- `GET /api/v1/admin/metrics` — metric catalog and product metrics
- `GET /api/v1/admin/alerts` — rules and incidents
- `GET /api/v1/admin/insights` — generated insights
- `GET /api/v1/admin/health` — component health
- `GET /api/v1/admin/traces?traceId=` — trace explorer
- `GET /api/v1/admin/experiments?flagKey=` — A/B/C comparison
- `GET /api/v1/admin/system` — full system dashboard
- `GET /api/v1/admin/search?q=` — global search

## Health Endpoints

- `GET /api/health/live` — liveness
- `GET /api/health/ready` — readiness (DB check)
- `GET /api/health/startup` — startup/uptime

## Telemetry Schema

See `lib/telemetry/schema.ts` for `TelemetryEventInput` and `METRIC_CATALOG`.

Every log includes: `correlationId`, `requestId`, `traceId`, `userId`, `sessionId`, `environment`, `version`.

## Audit Integrity

Audit records use SHA256 hash chaining (`lib/audit/integrity.ts`). Verify via `GET /api/v1/admin/system` → `auditChain`.

## Policy Engine

Condition-based policies in `lib/admin/policy.ts` extend role permissions (business hours, deny rules).

## Alert Guide

1. Create rules via `POST /api/v1/admin/alerts` with `metricName`, `condition` (`gt`|`lt`|`eq`), `threshold`, `severity`.
2. Evaluate with `{ "action": "evaluate" }`.
3. Acknowledge incidents with `{ "action": "acknowledge", "incidentId": "..." }`.

## Tracing

Use `lib/tracing/context.ts` for trace/span IDs. Spans persist to `TraceSpan` and are queryable by `traceId`.

## Metrics Catalog

Key metrics: `users.dau`, `arena.queue_latency_ms`, `scheduler.runtime_ms`, `api.latency_ms`, `cache.hit_ratio`.

Run `bun test __tests__/observability.test.ts` for coverage.
