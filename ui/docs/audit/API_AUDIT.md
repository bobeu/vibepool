# API Audit — Prompt 15

**Total routes:** 100  
**Active:** 89 | **Dormant:** 6 | **Internal:** 5

## Dormant Endpoints (410 at launch)

| Route | Replacement | Status |
|-------|-------------|--------|
| `GET/POST /api/spin` | `/api/spins` | DORMANT |
| `GET/POST /api/reward` | `/api/rewards`, `/api/rewards/claim` | DORMANT |
| `GET/POST /api/prediction` | `/api/predictions` | DORMANT |
| `GET /api/notification` | `/api/notifications` | DORMANT |
| `POST /api/wallet` | `/api/auth/login` | DORMANT |

All return `410` with `X-Nexora-Route-Status: DORMANT` header unless `enableLegacyStubRoutes` is true.

## Duplicate Endpoints (Intentional Aliases)

v1 routes re-export non-v1 handlers for versioning:

| v1 | Canonical |
|----|-----------|
| `/api/v1/arena/*` | `/api/arena/*` |
| `/api/v1/seasons` | `/api/seasons` |
| `/api/v1/campaigns` | `/api/campaigns` |
| `/api/v1/content` | `/api/content` |
| `/api/v1/feature-flags` | `/api/feature-flags` |
| `/api/v1/liveops` | `/api/liveops` |
| `/api/v1/events` | `/api/events` |
| `/api/v1/banners` | `/api/banners` |

## Health Endpoints (Overlap)

| Route | Purpose |
|-------|---------|
| `/api/health/live` | Liveness (public) |
| `/api/health/ready` | Readiness + DB ping |
| `/api/health/startup` | Uptime/version |
| `/api/internal/liveness` | Legacy internal |
| `/api/internal/readiness` | Legacy internal |
| `/api/internal/health` | Legacy internal |

**Recommendation:** Consolidate to `/api/health/*` only post-launch.

## Authentication Coverage

| Category | Auth Method |
|----------|-------------|
| Player APIs | `authenticatedHandler` (Bearer JWT) |
| Admin APIs | `adminHandler` + role permissions + policy engine |
| Internal scheduler | `authenticatedHandler` + admin permission |
| Health/live | Public |
| Legacy dormant | Public (410) |

## Rate Limiting Coverage

| Route | Rate Limited |
|-------|--------------|
| Most player APIs | Via `authenticatedHandler` patterns |
| `/api/prediction` (legacy) | Yes (in-memory stub) |
| Admin APIs | No dedicated limit — **gap** |
| Auth login | Should verify — **audit recommended** |

## Validation Consistency

- Admin routes: JSON body parsing with try/catch
- Player routes: Mixed — some use zod, some manual validation
- **Gap:** No unified request schema validation layer

## Admin API Inventory (22 routes)

All under `/api/v1/admin/*` with permission checks. Observability cluster added in Prompt 14.

## Fixes Applied (Prompt 15)

- Admin scheduler now uses `getSchedulerEngine()` with registered handlers
- `SchedulerService` permission corrected to `scheduler:execute`

## Response Consistency

Standard: `jsonResponse()` / `apiError()` from `lib/api/responses`. Legacy dormant routes use `ApiErrorResponse` shape with `code: "DORMANT_ROUTE"`.
