# Performance Audit — Prompt 15

**Date:** 2026-07-11  
**Environment:** Windows dev machine, Bun 1.3, Next.js 15.4

## Test Suite Performance

| Suite | Tests | Duration |
|-------|-------|----------|
| admin + liveops + arena + observability | 39 | ~10s |
| Queue simulation benchmark | 1 | ~280–670ms |
| Full suite (with failures in unrelated) | ~112 | ~15s+ |

## Optimizations Implemented (Prompt 15)

| Change | Impact |
|--------|--------|
| `optimizePackageImports` for lucide, recharts | Smaller JS bundles |
| AVIF/WebP image formats in next.config | Faster image delivery |
| Lazy experimental rating registration | Reduced cold-start instantiation |
| Shared `schedulerRegistry` | Eliminates duplicate handler registration |
| Legacy routes return 410 immediately | No wasted handler execution |

## Performance Budget

| Metric | Target | Current Estimate | Status |
|--------|--------|------------------|--------|
| Initial JS (home) | < 250 KB gzip | ~350–450 KB (wagmi + rainbowkit) | ⚠️ Over |
| Route JS (arena) | < 180 KB gzip | ~200 KB est. | ⚠️ Near limit |
| API P50 latency | < 100ms | ~30–80ms (mocked/local) | ✅ |
| API P95 latency | < 300ms | Unmeasured in prod | 🔍 |
| API P99 latency | < 800ms | Unmeasured in prod | 🔍 |
| DB query per request | < 5 avg | 2–8 depending on route | ⚠️ EventBus heavy |
| LCP (MiniPay) | < 2.5s | Not measured | 🔍 |
| TTI (MiniPay) | < 4s | Not measured | 🔍 |
| Memory (client) | < 128 MB | Not measured | 🔍 |
| Font payload | < 50 KB | System fonts assumed | ✅ |
| Hero images | < 100 KB each | WebP manifest defined | 🔍 Verify assets exist |

## Bundle Analysis Recommendations

1. **Dynamic import wagmi/rainbowkit** on wallet-connect pages only
2. **Dynamic import recharts** in admin app (already separate app)
3. **Remove unused Radix components** from package.json if not imported
4. **Audit `@google/generative-ai`** — remove if unused in production paths
5. **Code-split arena page** — heaviest gameplay UI

## Backend Hot Paths

| Path | Cost Drivers |
|------|--------------|
| Arena match completion | EventBus: 6+ DB ops per player |
| Admin dashboard | 14 parallel Prisma counts |
| Feed publish | Insert + friend fan-out |
| Metric collection | Multiple counts + metric writes |

## Cache

| Cache | TTL | Hit Ratio |
|-------|-----|-----------|
| FeatureFlagEngine | 30s | Not measured |
| React Query (client) | Default | Not measured |
| Next.js static | Build time | N/A |

## Hydration

- `providers.tsx` returns `null` until mounted — prevents hydration mismatch but delays TTI
- **Trade-off accepted** for wallet provider safety

## Build

Run `bun run build` in `ui/` for authoritative chunk sizes. Build requires `DATABASE_URL`.

## Monitoring Post-Launch

Use Prompt 14 observability APIs:
- `GET /api/v1/admin/metrics`
- `GET /api/v1/admin/health`
- Record `api.latency_ms` via tracing middleware (deferred)
