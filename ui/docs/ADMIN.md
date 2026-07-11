# NEXORA Admin Console

Standalone operations application for running NEXORA without code deployments.

## Architecture

```
vibepool/
  ui/                 # Player app + API backend (/api/v1/admin/*)
  apps/admin/         # Separate admin frontend (port 3002)
```

The admin app has its own routing, layout, navigation, and API client. It does **not** reuse player navigation.

## Running locally

```bash
# Terminal 1 — player API
cd ui && bun run dev

# Terminal 2 — admin console
cd apps/admin && bun install && bun run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:3001` in `apps/admin/.env.local`.

## Authentication

1. Log in via player API (`POST /api/auth/login`) with an admin wallet (`ADMIN_WALLETS` or `AdminPermission` row).
2. Paste the returned `accessToken` into the admin login screen.

Every admin API call requires `Authorization: Bearer <token>` and passes role/permission checks.

## Admin APIs

| Route | Description |
|-------|-------------|
| `GET /api/v1/admin/dashboard` | Operations overview |
| `GET/POST /api/v1/admin/users` | Search, suspend, compensate |
| `GET/POST /api/v1/admin/moderation` | Reports, fraud review |
| `GET/POST /api/v1/admin/arena` | Queue/match ops, simulator |
| `GET/POST /api/v1/admin/seasons` | Season management |
| `GET/POST /api/v1/admin/campaigns` | Campaign lifecycle |
| `GET/POST /api/v1/admin/feature-flags` | Flags + experiments |
| `GET/POST /api/v1/admin/scheduler` | Jobs, dry run, dependencies |
| `GET/POST /api/v1/admin/rewards` | Settlement ops |
| `GET /api/v1/admin/analytics` | DAU/WAU/MAU dashboards |
| `GET /api/v1/admin/audit` | Searchable audit log |
| `GET/POST /api/v1/admin/content` | CMS blocks, locales |
| `GET /api/v1/admin/auth` | Session role check |

## Permission Model

Roles: Super Admin, Platform Admin, Game Operator, Content Editor, Support, Analyst, Finance, Read Only.

Permissions are resource-based (`seasons:write`, `moderation:read`, etc.). All write actions are audit-logged.

## Prompt 12 Fixes Included

- Scheduler job dependencies + dry run
- Campaign pause/resume/clone/rollback/version history
- Feature flag A/B/C experiment groups
- ContentEngine locale fallback
- Standard event metadata on EventBus

## Deployment

- Deploy `ui` and `apps/admin` as separate services (different ports/domains).
- Use `admin.nexora.example.com` for the console; restrict via VPN or IP allowlist in production.
- Set `SUPER_ADMIN_WALLETS`, `PLATFORM_ADMIN_WALLETS` env vars.
- Enable CORS for admin origin on API if cross-domain.

## Before Prompt 14

- SSO / hardware wallet admin login
- Real-time dashboard websockets
- Full visual content editor with asset picker
- Export audit logs to S3
