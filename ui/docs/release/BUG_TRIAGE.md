# Bug Triage — Prompt 18

Lightweight process for 50–100 user closed beta. No new tooling required — use GitHub Issues, Linear, or shared spreadsheet.

---

## Severity Levels

| Level | Definition | Examples | Target resolution |
|-------|------------|----------|-------------------|
| **Critical** | App unusable for most users; data loss; security | Auth broken, DB down, reward duplication exploit | **4 hours** — fix or rollback |
| **High** | Core loop blocked for many users | Cannot submit prediction, arena never matches, claims fail | **24 hours** |
| **Medium** | Degraded UX; workaround exists | Wrong leaderboard rank, slow page, QR not scannable | **Beta sprint** (3–5 days) |
| **Low** | Cosmetic, edge case, polish | Button styling, copy typo, SSR warning in logs | **Post-beta** |

---

## Reproduction Template

Copy into every bug ticket:

```markdown
## Environment
- URL: staging / production
- Wallet (last 4): ____
- Device / OS: ____
- MiniPay version: ____
- Date/time (UTC): ____

## Steps
1.
2.
3.

## Expected
-

## Actual
-

## Severity
Critical / High / Medium / Low

## Evidence
Screenshots, HAR, admin user ID, request ID if available

## Related
KI-XX / B-XX / funnel event name
```

---

## Ownership

| Area | Primary owner | Backup |
|------|---------------|--------|
| Auth / session | Launch engineer | — |
| Wallet / MiniPay | Launch engineer | Product |
| Arena / matchmaking | Launch engineer | — |
| Predictions / tournaments | Launch engineer | — |
| Rewards / settlement | Launch engineer | Admin |
| Referrals / invites | Launch engineer | — |
| Admin / ops | Admin wallet holder | Launch engineer |
| Infrastructure / deploy | Launch engineer | — |

**Rule:** One assignee per ticket. WIP limit: 2 Critical, 5 High per person.

---

## Triage Cadence

| When | Action |
|------|--------|
| Daily (beta standup) | Review new reports, assign severity, update KNOWN_ISSUES |
| On Critical report | Page on-call within 15 min |
| Weekly | Groom Medium/Low; decide post-beta vs in-beta |

---

## Release Decision Criteria

### Ship hotfix deploy when

- Any **Critical** open > 4h without mitigation
- **High** affecting > 10% of DAU (estimate from beta dashboard)
- Security issue confirmed

### Defer deploy when

- Only Low/Medium open
- Fix not verified locally + smoke tests
- Friday after 16:00 UTC without on-call coverage

### No-Go triggers (see BETA_GO_NO_GO.md)

- Unmitigated Critical > 24h
- Auth or DB integrity compromised
- > 25% session failure rate (manual estimate)

---

## Linking to Known Issues

| ID | Track in triage as |
|----|-------------------|
| KI-01 – KI-05 | Pre-documented; update status only |
| New issues | Assign KI-06+ after confirmation |

Update [KNOWN_ISSUES.md](../beta/KNOWN_ISSUES.md) when a workaround changes or issue is resolved.

---

## Beta Feedback Intake

Player submissions use [BETA_FEEDBACK_TEMPLATE.md](../beta/BETA_FEEDBACK_TEMPLATE.md). Internal triage fields map 1:1 to this workflow.
