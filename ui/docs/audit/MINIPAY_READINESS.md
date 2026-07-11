# MiniPay Readiness Report — Prompt 15

## Wallet Integration

| Item | Status | Notes |
|------|--------|-------|
| Wagmi + RainbowKit | ✅ | Celo chain configured |
| Wallet reconnect | ⚠️ | Standard wagmi reconnect; test on device |
| MiniPay detection | ⚠️ | `minipayOnly` feature flag exists; verify MiniPay provider |
| Transaction UX | ⚠️ | BlockchainService stub — on-chain txs not wired to UI API |

## Mobile UX

| Item | Status | Notes |
|------|--------|-------|
| Touch targets | ⚠️ | Audit needed on arena/spin buttons (min 44px) |
| Safe areas | ⚠️ | No explicit `env(safe-area-inset-*)` in globals |
| Viewport meta | ✅ | Next.js default |
| Route transitions | ✅ | Client-side navigation |
| Loading states | ✅ | Most pages have loading/fallback patterns |
| Offline mode | ❌ | No service worker / offline cache |
| Low memory | ⚠️ | Heavy providers (wagmi) — lazy load recommended |

## Network Resilience

| Item | Status |
|------|--------|
| API error handling | Partial — varies by page |
| Retry on failure | Not standardized |
| Toast on network error | Some pages |

## Animation

| Item | Status |
|------|--------|
| UnlockAnimationEngine | ✅ Server-driven queue |
| Framer Motion usage | Verify reduced-motion preference |

## Launch-Critical Flows for MiniPay

| Flow | Ready | Blockers |
|------|-------|----------|
| Login (wallet) | ✅ | — |
| Predictions | ✅ | — |
| Arena | ✅ | — |
| Missions | ✅ | — |
| Spin | ✅ | — |
| Rewards claim | ✅ | — |
| Referrals | ✅ | — |
| On-chain settlement | ❌ | BlockchainService stub |

## Recommendations

1. Add `viewport-fit=cover` and safe-area CSS for notched devices
2. Lazy-load wallet providers on `/` and auth-gated pages
3. Add global network error boundary with retry
4. Test full flows in MiniPay browser before launch
5. Wire `BlockchainSyncService` when treasury/settlement goes live

## Performance Targets (MiniPay)

- First paint < 2s on 3G
- Interactive < 4s
- No jank during arena countdown (60fps target)
