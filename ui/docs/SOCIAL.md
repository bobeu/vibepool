# NEXORA Social Layer Architecture

## Overview

The social layer transforms NEXORA from a solo competitive app into a lightweight community platform. All social features route through the existing engine layer, EventBus, and RewardEngine-compatible settlement paths.

## Engines

| Engine | Responsibility |
|--------|----------------|
| `FriendEngine` | Requests, accept/reject, block, remove |
| `ReferralEngine` | Milestone tracking, reward claims |
| `InviteEngine` | Codes, deep links, MiniPay links, redemption |
| `FeedEngine` | Activity feed publish + friend-scoped visibility |
| `PresenceEngine` | Online status with TTL expiry |
| `CommunityEngine` | Admin announcements and spotlight posts |
| `SocialSettingsEngine` | Privacy controls |
| `UnlockAnimationEngine` | Priority-based unlock celebration queue |

## Referral Flow

1. Referrer generates invite via `/api/invites`
2. New user logs in with `refCode` in auth payload
3. `InviteEngine.redeem()` creates `Referral` record
4. `REGISTERED` milestone fires automatically
5. Gameplay events (`ActivityRecorded`) trigger further milestones:
   - `FIRST_PREDICTION`
   - `FIRST_TOURNAMENT`
   - `THIRD_ACTIVE_DAY`
   - `FIRST_REWARD`
6. Referrer claims rewards via `/api/referrals`

## Presence Model

- Heartbeat from `AppShell` every 3 minutes
- TTL defaults to 5 minutes (`PRESENCE_TTL_MS`)
- `OFFLINE` and `INVISIBLE` do not expire artificially
- Friends see presence only when target allows online status

## Privacy Model

`SocialSettings` controls:

- Profile visibility (`PUBLIC` / `FRIENDS` / `PRIVATE`)
- Activity visibility
- Online status display
- Friend request acceptance
- Referral visibility

Feed and presence respect these settings at read time.

## Feed Model

Feed items are created from domain events:

- Achievement unlocked
- Friend request / accepted
- Referral milestone
- Badge / title equipped

Friend activity is fan-out via `FeedEngine.publishForFriends()` with `FRIENDS` visibility.

## Invite System

Supported invite types:

- `INVITE_CODE`
- `DEEP_LINK`
- `QR` (URL placeholder for future QR renderer)
- `MINIPAY` (Opera MiniPay dapp wrapper)

## Community Module

Read-only for players. Admin wallets (`ADMIN_WALLETS` env) can POST announcements via `/api/community`.

## Animation Priority

| Type | Priority | Interrupt |
|------|----------|-----------|
| Legendary achievement | URGENT | Yes |
| Epic achievement / badge / level up | HIGH | Yes |
| Standard unlock | NORMAL | No |
| XP toast | LOW | No |

Pending animations are consumed by `UnlockAnimationToast` in the app shell.

## APIs

```
GET/POST  /api/friends
POST      /api/friends/request|respond|block|unblock
GET       /api/feed
GET/POST  /api/referrals
GET/POST  /api/invites
GET/POST  /api/presence
GET/POST  /api/community
GET/POST  /api/social/settings
GET/POST  /api/animations
GET       /api/profile/timeline
```

## Recommendations Before Prompt 11 (Competitive Arena)

1. Add WebSocket or SSE for live presence and feed (optional)
2. Populate physical asset library under `public/assets/`
3. Add mutual friends and guild-scoped feeds
4. Wire tournament win events into friend feed fan-out
5. Add rate limiting on friend requests and invite generation
6. Expand admin console for community moderation
