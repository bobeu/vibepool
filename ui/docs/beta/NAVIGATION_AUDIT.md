# Navigation Audit — Prompt 17

## Decision: MiniPay-Optimized Discoverability

Bottom navigation stays at **10 items** (MiniPay simplicity). Secondary features use **Profile Hub** + **Home Quick Actions**.

| Feature | Route | Placement | Rationale |
|---------|-------|-----------|-----------|
| Missions | `/missions` | Home card + Profile hub + Quick actions (filtered from duplicate) | High daily engagement |
| Achievements | `/achievements` | Profile hub "View all" + Home quick actions | Progression, not daily |
| Feed | `/feed` | Profile hub link | Social secondary |
| Referrals | `/referrals` | Profile hub + Home quick actions | Growth, not core loop |
| Rewards | `/rewards` | Home quick actions | Claim flow |
| Spin | `/spin` | Home card + bottom nav | Core loop |

## Bottom Nav (unchanged)

Home · Tournament · Arena · Season · Events · Spin · Leaderboard · Friends · Community · Profile

## Changes Applied

- Profile Social section: Missions, Feed, Referrals links
- Profile Achievements: "View all" → `/achievements`
- Home Quick Actions: Achievements, Referrals added
- Referrals page: QR image renders from `/api/invites/qr`

## Not Added to Bottom Nav

Achievements, Feed, Missions, Referrals — would exceed MiniPay thumb-zone ergonomics.
