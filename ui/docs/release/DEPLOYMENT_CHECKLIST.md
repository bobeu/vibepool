# Deployment Checklist — Prompt 18

Pre-deploy, deploy, and post-deploy validation. No CI/CD yaml in repo — run manually or wire into host pipeline.

---

## Pre-Deploy

### Code & config

- [ ] Branch merged to `main` (or release tag created)
- [ ] [BETA_CONFIGURATION.md](./BETA_CONFIGURATION.md) flags reviewed — settlement **off** for week 1
- [ ] No secrets in git (`.env` local only)
- [ ] `addresses.json` matches target chain (Sepolia `11142220`)

### Automated gate

```bash
cd ui
bun run release:check
```

Covers: Prisma generate, integration tests (7), production build.

### Database

- [ ] Staging migration tested: `bun run db:push` or `db:migrate`
- [ ] Production backup taken (timestamp recorded)
- [ ] Seed applied if fresh environment

### Environment (staging → prod)

- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_APP_URL` (correct domain)
- [ ] `NEXT_PUBLIC_WALLETCONNECT_ID`
- [ ] `SUPER_ADMIN_WALLETS` / `ADMIN_WALLETS`
- [ ] `NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API` (optional but recommended)
- [ ] `APP_VERSION` set for health output

---

## Deploy

- [ ] Trigger host deploy from `main`
- [ ] Build logs green (no TypeScript / Prisma errors)
- [ ] Previous revision ID noted for rollback

---

## Post-Deploy Smoke

### Health

```bash
curl -s https://<host>/api/health/live
curl -s https://<host>/api/health/ready
```

Expect: `200`, readiness includes DB OK.

### Auth contract

```bash
curl -s https://<host>/api/auth/session
```

Expect: `401` without cookie/token.

### Automated E2E (against deployed URL)

```bash
cd ui
PLAYWRIGHT_BASE_URL=https://<host> PLAYWRIGHT_SKIP_WEBSERVER=1 bun run test:e2e
```

Target: 16+ pass, 0 Critical failures.

### Manual (MiniPay)

See [SMOKE_TESTS.md](../beta/SMOKE_TESTS.md) — wallet connect + one prediction + arena queue minimum.

### Admin

```bash
curl -s -H "Authorization: Bearer <admin>" https://<host>/api/v1/admin/beta
```

Expect: JSON with `activeBetaUsers`, `betaFunnel`, `generatedAt`.

---

## Rollback

Follow [ROLLBACK_GUIDE.md](../beta/ROLLBACK_GUIDE.md):

1. Feature flag disable (fastest)
2. `git revert` + redeploy (full rollback)

Post-rollback: re-run health + smoke section above.

---

## Release Scripts Reference

| Script | Purpose |
|--------|---------|
| `bun run release:check` | Pre-deploy validation |
| `bun run build` | Production Next.js build |
| `bun run start` | Local prod server (:3001) |
| `bun run test` | Vitest (integration + unit) |
| `bun run test:e2e` | Playwright critical journeys |
| `bun run db:generate` | Prisma client |
| `bun run db:push` | Schema sync (non-prod caution) |

---

## Sign-Off

| Role | Name | Date | Go |
|------|------|------|-----|
| Launch engineer | | | ☐ |
| Product | | | ☐ |

Proceed to [BETA_GO_NO_GO.md](./BETA_GO_NO_GO.md) for final decision.
