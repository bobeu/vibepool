# Smoke Tests — Closed Beta

## Automated (Playwright)

```bash
cd ui
bun run test:e2e
```

Coverage:

- All primary routes load (home, arena, missions, spin, rewards, profile, referrals, achievements, feed)
- Profile hub navigation links work
- Home quick actions visible
- Invite QR endpoint returns SVG
- Settlement API requires auth
- Auth session/refresh contract

Report: `ui/e2e-report/index.html`

## Manual MiniPay Checklist

- [ ] Wallet connect in MiniPay browser
- [ ] Sign message → session created
- [ ] Submit prediction on `/prediction`
- [ ] Queue arena match
- [ ] Claim mission reward
- [ ] Execute spin
- [ ] View leaderboard
- [ ] Generate invite QR on referrals page
- [ ] Logout clears session
- [ ] Background/resume maintains session (within expiry window)
- [ ] Offline → reconnect shows retry, not crash

## API Health

```bash
curl -s http://localhost:3001/api/internal/health
curl -s http://localhost:3001/api/internal/readiness
```

## Admin Beta Dashboard

```bash
curl -H "Authorization: Bearer <admin-token>" http://localhost:3001/api/v1/admin/beta
```
