# Known Issues — Closed Beta

| ID | Severity | Area | Issue | Workaround | Target |
|----|----------|------|-------|------------|--------|
| KI-01 | Low | Wallet | indexedDB warnings during SSR build | None — runtime unaffected | Post-beta |
| KI-02 | Medium | Settlement | On-chain payout requires `BACKEND_SIGNER_PRIVATE_KEY` + `enableBlockchainSettlement` | Off-chain rewards work | Beta week 2 |
| KI-03 | Low | QR | QR SVG is beta fallback pattern, not scannable on all devices | Use invite code copy | Beta |
| KI-04 | Low | Arena | Some button variants use legacy prop values | Functional | Polish sprint |
| KI-05 | Info | Tests | Vitest engine mocks have pre-existing gaps | E2E covers critical paths | Ongoing |

## Resolved (Prompt 17)

- B-06 Navigation — Profile hub + home quick actions
- B-07 `/api/invites/qr` implemented
- B-04 Settlement API wired (feature-flagged)
- B-05 Playwright E2E suite added
