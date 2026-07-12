# Feedback Workflow — Prompt 18

Structured processing for closed beta feedback. Builds on [BETA_FEEDBACK_TEMPLATE.md](../beta/BETA_FEEDBACK_TEMPLATE.md).

---

## Intake Channels

| Channel | Owner | SLA to acknowledge |
|---------|-------|-------------------|
| In-app / community form | Product | 24h |
| Direct message / Telegram | Community mod | 24h |
| Admin moderation reports | Launch engineer | 48h |
| Beta dashboard `topReportedIssues` | Launch engineer | Daily review |

---

## Classification

Assign **one primary** category per report:

| Category | Signals | Route to |
|----------|---------|----------|
| **UX** | Confusing flow, copy, navigation | Product + design backlog |
| **Gameplay** | Rules, balance, fairness, missing features | Product prioritization |
| **Performance** | Slow load, jank, timeouts | Launch engineer |
| **Bugs** | Broken behavior, errors, 4xx/5xx | [BUG_TRIAGE.md](./BUG_TRIAGE.md) |
| **Feature requests** | "I wish it could…" | Post-beta backlog |
| **Blockchain** | Tx failed, wrong chain, gas | Launch engineer (settlement flag) |
| **Wallet** | Connect, sign, disconnect | Launch engineer |
| **MiniPay compatibility** | In-app browser only | Launch engineer + MiniPay QA doc |

---

## Prioritization Matrix

Impact (rows) × Effort (columns). **Do first:** top-left.

|  | Low effort | High effort |
|--|------------|-------------|
| **High impact** (blocks loop / many users) | **P0 — Fix this sprint** | **P1 — Plan + spike** |
| **Medium impact** (workaround exists) | **P2 — Quick win queue** | **P3 — Schedule post-beta** |
| **Low impact** (single user / polish) | **P4 — Batch polish** | **P5 — Defer / won't fix** |

### Mapping to severity

| Matrix | Bug severity |
|--------|--------------|
| P0 | Critical / High |
| P1–P2 | High / Medium |
| P3–P5 | Medium / Low |

---

## Processing Steps

1. **Acknowledge** — reply with ticket ID or "received"
2. **Classify** — category + matrix cell
3. **Dedupe** — merge duplicates; link to KI-XX if known
4. **Reproduce** — use reproduction template from BUG_TRIAGE
5. **Decide** — fix in-beta / workaround / post-beta
6. **Close loop** — notify reporter when shipped or deferred

---

## Weekly Feedback Summary

Produce every Monday:

| Metric | Source |
|--------|--------|
| New reports | Intake count |
| By category | Classification tags |
| Top 3 themes | Manual cluster |
| Shipped fixes | Closed tickets |
| Deferred to post-beta | P3–P5 count |

Cross-reference beta funnel (`GET /api/v1/admin/beta` → `betaFunnel`) for drop-off vs feedback themes.

---

## Feature Request Handling

**Closed beta rule:** Log all feature requests; do **not** implement new gameplay during beta unless Critical mitigation.

Tag: `post-beta` + one-line rationale in POST_BETA_ACTION_PLAN backlog section.

---

## MiniPay-Specific

Refer to [MINIPAY_QA_REPORT.md](../beta/MINIPAY_QA_REPORT.md) for device matrix. Tag MiniPay-only issues for separate weekly review with Celo/MiniPay contacts if needed.
