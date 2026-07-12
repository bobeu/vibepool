# Integration Matrix — Prompt 16

| Feature | UI | API | Engine | DB | Contracts | Status |
|---------|-----|-----|--------|-----|-----------|--------|
| Auth (wallet sign-in) | ✅ WalletSessionSync | ✅ `/api/auth/*` | Session + resolveUser | Session, UserProfile | — | **Working** (fixed) |
| Predictions | ✅ `/prediction` | ✅ `/api/predictions` | PredictionEngine | Prediction, Tournament | — | **Working** |
| Tournaments | ✅ `/tournament` | ✅ `/api/tournaments` | TournamentService | Tournament | — | **Working** |
| Leaderboard | ✅ `/leaderboard` | ✅ `/api/leaderboard` | LeaderboardService | LeaderboardSnapshot | — | **Working** (fixed shape) |
| Arena | ✅ `/arena` | ✅ `/api/arena/*` | Arena stack | Arena models | — | **Working** |
| Missions | ✅ `/missions` | ✅ `/api/missions` | MissionEngine | userMission | — | **Working** (fixed) |
| Spins | ✅ `/spin` | ✅ `/api/spins` | Spin/WheelEngine | spinLedger | — | **Working** (fixed) |
| Rewards | ✅ `/rewards` | ✅ `/api/rewards` | RewardClaimEngine | pendingReward | — | **Working** (fixed) |
| Achievements | ✅ `/achievements` | ✅ `/api/achievements` | AchievementEngine | userAchievement | — | **Partial** (nav) |
| Referrals | ✅ `/referrals` | ✅ `/api/referrals` | ReferralEngine | referral | — | **Working** |
| Community | ✅ `/community` | ✅ `/api/community` | CommunityEngine | communityPost | — | **Working** |
| Feed | ✅ `/feed` | ✅ `/api/feed` | FeedEngine | feedItem | — | **Partial** (nav) |
| Seasons | ✅ `/season` | ✅ `/api/seasons` | SeasonEngine | seasonProgress | — | **Working** |
| Friends | ✅ `/friends` | ✅ `/api/friends/*` | FriendEngine | friendship | — | **Working** |
| Blockchain settlement | ❌ | ❌ | BlockchainSyncService | — | addresses.json | **Disconnected** |

## Fixes Applied (Prompt 16)

- Auth session schema alignment + async middleware
- Wallet → userId resolution in services
- Service instance pattern in API routes
- Leaderboard response normalization
- Prediction UI wired to API
- Mission claim + reward claim UI
