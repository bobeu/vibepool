# Test Accounts — Closed Beta

> Do not commit private keys. Use environment-specific wallets only.

## Internal QA Wallets

Configure in `.env.local`:

```env
BETA_TEST_WALLET_1=0x...
BETA_TEST_WALLET_2=0x...
ADMIN_WALLET=0x...
```

## Seeded Profiles

Run `bun run db:seed` to create baseline missions, tournaments, and settings.

## Admin Access

Admin routes require wallet in `ADMIN_WALLETS` env (comma-separated).

Endpoints for beta ops:

- `GET /api/v1/admin/beta` — beta dashboard
- `GET /api/v1/admin/dashboard` — full ops dashboard
- `POST /api/v1/admin/rewards` — settlement processing

## Playwright

```bash
cd ui
bun run test:e2e
```

Set `PLAYWRIGHT_BASE_URL` for staging deployments.
