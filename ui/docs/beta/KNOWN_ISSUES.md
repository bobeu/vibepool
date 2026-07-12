# Known Issues — Closed Beta

| ID | Severity | Area | Issue | Workaround | Target |
|----|----------|------|-------|------------|--------|
| KI-01 | Low | Wallet | indexedDB warnings during SSR build | None — runtime unaffected | Post-beta |
| KI-02 | Medium | Settlement | On-chain payout requires `BACKEND_SIGNER_PRIVATE_KEY` + `enableBlockchainSettlement` | Off-chain rewards work | Beta week 2 |
| KI-03 | Low | QR | QR SVG is beta fallback pattern, not scannable on all devices | Use invite code copy | Beta |
| KI-04 | Low | Arena | Some button variants use legacy prop values | Functional | Polish sprint |
| KI-05 | Info | Tests | Vitest engine mocks have pre-existing gaps | E2E covers critical paths | Ongoing |

## Prompt 18 Review (2026-07-12)

| ID | Status confirmed | Workaround valid | Beta impact | Fix timing |
|----|------------------|------------------|-------------|------------|
| KI-01 | ✅ Open | N/A — build warning only | **None** — runtime unaffected | **After beta** |
| KI-02 | ✅ Open | Off-chain rewards fully functional | **Low** week 1 (settlement off) | **During beta week 2+** if enabling chain |
| KI-03 | ✅ Open | Copy invite code | **Low** — QR is visual fallback | **After beta** (scannable QR) |
| KI-04 | ✅ Open | Buttons work | **None** functional | **After beta** polish |
| KI-05 | ✅ Open | Playwright E2E gates deploy | **None** for players | **Ongoing** — not blocking beta |

**Recommendation:** No KI items block closed beta Go decision. Address KI-02 only when toggling `enableBlockchainSettlement`.

## Resolved (Prompt 17)

- B-06 Navigation — Profile hub + home quick actions
- B-07 `/api/invites/qr` implemented
- B-04 Settlement API wired (feature-flagged)
- B-05 Playwright E2E suite added
