# Performance Baseline — Prompt 18

**Captured:** 2026-07-12  
**Environment:** Windows dev, Bun 1.3, Next.js 15.4.8, Node production build  
**Purpose:** Reference for beta regression comparisons — do not treat as production SLA.

---

## Build & Startup

| Metric | Baseline | Notes |
|--------|----------|-------|
| `bun run build` | Pass (~2–4 min local) | Requires `DATABASE_URL` for Prisma |
| `bun run start` cold | ~3–8s to listen :3001 | Platform will differ |
| Middleware size | 33.4 kB | From build output |
| Integration tests | 7/7 pass, ~2–5s | `__tests__/integration.test.ts` |
| E2E (prod server) | 16 pass, 1 skip | `e2e/critical-journeys.spec.ts` |

---

## Bundle Size (Production Build)

Shared by all routes:

| Chunk | Size |
|-------|------|
| First Load JS shared | **102 kB** |

Representative routes (First Load JS):

| Route | Total First Load JS |
|-------|---------------------|
| `/` (home) | ~372 kB |
| `/arena` | ~372 kB |
| `/prediction` | ~370 kB |
| `/profile` | ~372 kB |

**Note:** Wallet stack (wagmi + RainbowKit) dominates; over Prompt 15 budget (~250 kB gzip target). Accept for beta; optimize post-beta.

---

## API Latency (Local / Mocked)

From [PERFORMANCE_AUDIT.md](../audit/PERFORMANCE_AUDIT.md):

| Percentile | Estimate | Status |
|------------|----------|--------|
| P50 | 30–80 ms | ✅ Under 100 ms target |
| P95 | Not measured | 🔍 Establish in staging week 1 |
| P99 | Not measured | 🔍 Establish in staging week 1 |

Health endpoints (local):

| Endpoint | Typical |
|----------|---------|
| `/api/health/live` | < 20 ms |
| `/api/health/ready` | 50–200 ms (DB ping) |

---

## Memory

| Area | Baseline | Status |
|------|----------|--------|
| Server process | Not captured | Monitor on host dashboard |
| Client (MiniPay) | Not captured | Manual MINIPAY_QA pass |

**Action during beta:** Record host memory once daily for first week; note spikes correlated with deploys.

---

## Render Performance (Client)

| Metric | Target (audit) | Baseline | Status |
|--------|----------------|----------|--------|
| LCP | < 2.5s | Not measured | 🔍 MiniPay manual |
| TTI | < 4s | Delayed by wallet mount (`providers.tsx`) | Known trade-off |
| Hydration | No mismatch | `null` until mounted | ✅ Stable |

---

## Backend Hot Paths (Reference)

| Path | Relative cost |
|------|---------------|
| Arena match completion | High (EventBus, 6+ DB ops) |
| Admin dashboard | Medium (parallel counts) |
| Beta dashboard | Medium |
| Auth login | Low–medium |

---

## Test Suite Timing

| Suite | Duration |
|-------|----------|
| Integration only | ~2–5s |
| Full vitest (if run) | ~10–15s |
| Playwright E2E | ~2–4 min (serial, prod server) |

---

## Comparison Protocol (During Beta)

When investigating regressions:

1. Re-run `bun run build` — compare First Load JS per route
2. Re-run `bun run release:check`
3. Compare `apiFailures24h` on beta dashboard vs this baseline week
4. Log staging P95 if host provides APM

**Regression thresholds (suggested):**

- First Load JS +10% on home → investigate bundle
- P95 API +50% vs staging week-1 average → investigate DB/query
- E2E failures > 0 on critical paths → no-go for widen beta

---

## Commands to Refresh Baseline

```bash
cd ui
bun run build 2>&1 | tee build-baseline.txt
bun run test __tests__/integration.test.ts
bun run start &
PLAYWRIGHT_SKIP_WEBSERVER=1 bun run test:e2e
```

Update this document after major releases.
