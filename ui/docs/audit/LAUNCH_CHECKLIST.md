# Launch Checklist — Prompt 15

## Environment Variables

- [ ] `DATABASE_URL` — PostgreSQL connection string
- [ ] `JWT_SECRET` / session secret — strong random value
- [ ] `SUPER_ADMIN_WALLETS` — comma-separated admin wallets
- [ ] `NEXT_PUBLIC_API_URL` — player app API base
- [ ] Admin: `NEXT_PUBLIC_API_URL=http://<ui-host>:3001`
- [ ] `APP_VERSION` — for logging/health
- [ ] `ARENA_RATING_STRATEGY=simple` — confirm default
- [ ] Celo RPC URL for wagmi
- [ ] Contract addresses in `lib/contracts/addresses.json`

## Build

- [ ] `cd ui && bun install && bun run db:generate`
- [ ] `bun run build` — player app
- [ ] `cd apps/admin && bun install && bun run build`
- [ ] Verify standalone output deploys

## Database

- [ ] Run migrations / `db:push` on production
- [ ] Seed admin permissions if not using env wallets
- [ ] Verify indexes on hot tables
- [ ] Backup strategy configured

## Contracts

- [ ] Deployed addresses match `addresses.json`
- [ ] ABIs match deployed bytecode
- [ ] Treasury wallet funded (when settlement enabled)

## MiniPay

- [ ] Test login flow in MiniPay browser
- [ ] Verify touch targets on arena/spin
- [ ] Test on low-memory Android device
- [ ] Safe area CSS applied

## Monitoring

- [ ] `/api/health/live` probed by load balancer
- [ ] `/api/health/ready` probed with DB check
- [ ] Admin observability dashboard accessible
- [ ] Alert rules seeded (arena queue, dead letter, settlement backlog)

## Backups

- [ ] Daily PostgreSQL backups
- [ ] Audit log export schedule

## Rollback

- [ ] Previous Docker image tagged
- [ ] DB migration rollback plan documented
- [ ] Feature flags for kill-switch

## Support

- [ ] Admin moderation queue staffed
- [ ] Fraud alert review process

## Analytics

- [ ] DAU/WAU/MAU collection verified
- [ ] Daily dashboard snapshot job scheduled

## Alert Verification

- [ ] POST `/api/v1/admin/alerts` `{ "action": "evaluate" }`
- [ ] Test acknowledge flow

## Security

- [ ] HTTPS enforced
- [ ] Admin wallets rotated if compromised
- [ ] Rate limit on auth endpoints
- [ ] Secrets not in git

## Smoke Tests

- [ ] Login with test wallet
- [ ] Submit prediction
- [ ] Join arena queue (or dry run)
- [ ] Complete mission
- [ ] Execute spin
- [ ] Claim reward
- [ ] Admin dashboard loads
- [ ] Health endpoints return 200

## Post-Launch (Week 1)

- [ ] Review observability metrics daily
- [ ] Audit chain verification weekly
- [ ] Review TECHNICAL_DEBT.md priorities
