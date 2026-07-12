# Post-Beta Action Plan — Prompt 18

Prioritized work after closed beta (50–100 users). Derived from known issues, monitoring gaps, and performance baseline.

---

## Phase 1 — Stabilize (Weeks 1–2 post-beta)

| Priority | Item | Source |
|----------|------|--------|
| P0 | Fix all Critical/High bugs from triage | BUG_TRIAGE backlog |
| P0 | Enable on-chain settlement only after Sepolia validation | KI-02, BETA_CONFIGURATION |
| P1 | Add arena + prediction **completion rate** to beta dashboard | MONITORING_REVIEW gap |
| P1 | True DAU metric (distinct logins per day) | MONITORING_REVIEW gap |
| P1 | Staging P95/P99 API latency capture | PERFORMANCE_BASELINE |
| P2 | Client error boundary → server log or lightweight crash ping | Monitoring gap |

---

## Phase 2 — Performance (Weeks 3–4)

| Priority | Item | Source |
|----------|------|--------|
| P1 | Dynamic import wagmi/RainbowKit on connect-only routes | PERFORMANCE_AUDIT |
| P1 | Code-split arena page | PERFORMANCE_AUDIT |
| P2 | Measure LCP/TTI on MiniPay; document | PERFORMANCE_BASELINE |
| P2 | Reduce EventBus DB ops on arena completion | PERFORMANCE_AUDIT hot path |
| P3 | Remove unused deps (e.g. generative-ai if unused) | Bundle audit |

---

## Phase 3 — Product & Polish

| Priority | Item | Source |
|----------|------|--------|
| P2 | Scannable QR (proper encoding) | KI-03 |
| P3 | Arena button variant cleanup | KI-04 |
| P3 | Vitest engine mock gaps | KI-05 |
| Backlog | Feature requests tagged `post-beta` | FEEDBACK_WORKFLOW |

---

## Phase 4 — Widen Release

| Gate | Criteria |
|------|----------|
| Open beta | Zero Critical > 7 days; D7 retention ≥ 20%; settlement tested OR remains off with comms |
| Public launch | CI/CD pipeline; automated deploy + rollback; on-call rotation |
| Mainnet | Separate security review; treasury ops runbook |

---

## Known Issues Disposition

| ID | Post-beta action |
|----|------------------|
| KI-01 | Monitor; fix if SSR affects hosting |
| KI-02 | Week 2+ settlement enable playbook |
| KI-03 | Replace QR SVG with scannable implementation |
| KI-04 | UI polish sprint |
| KI-05 | Expand vitest mocks; keep E2E as gate |

---

## Infrastructure Debt

- Add GitHub Actions (or host-native): `release:check` on PR + E2E on staging
- Seed alert rules automatically on deploy
- Automated DB backup verification before migrate

---

## Feedback → Backlog Process

Continue weekly feedback summary (FEEDBACK_WORKFLOW). Quarterly review of deferred P3–P5 items.

---

## Owner

Launch engineer maintains this plan; product reprioritizes monthly.
