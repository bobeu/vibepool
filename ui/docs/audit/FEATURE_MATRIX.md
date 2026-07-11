# Feature Matrix — Prompt 15

| Feature | Status | Connected | UI | API | Engine |
|---------|--------|-----------|-----|-----|--------|
| Wallet Login | Production Ready | ✅ | ✅ | `/api/auth/*` | Session |
| Predictions | Production Ready | ✅ | `/prediction` | `/api/predictions` | PredictionEngine |
| Tournaments | Production Ready | ✅ | `/tournament` | `/api/tournaments` | GameEngine |
| Leaderboard | Production Ready | ✅ | `/leaderboard` | `/api/leaderboard` | RankingEngine |
| Daily Missions | Production Ready | ✅ | `/missions` | `/api/missions` | MissionEngine |
| Spin Wheel | Production Ready | ✅ | `/spin` | `/api/spins` | WheelEngine |
| Rewards | Production Ready | ✅ | `/rewards` | `/api/rewards` | RewardClaimEngine |
| Streaks | Production Ready | ✅ | Profile | `/api/streak` | StreakEngine |
| Progression/Level | Production Ready | ✅ | Profile | `/api/progression` | GamificationEngine |
| Achievements | Production Ready | ✅ | `/achievements` | `/api/achievements` | AchievementEngine |
| Profile/Badge/Title | Production Ready | ✅ | `/profile` | `/api/profile/*` | IdentityEngine |
| Arena | Production Ready | ✅ | `/arena` | `/api/arena/*` | ArenaEngine |
| Arena Replay | Production Ready | ✅ | `/arena/replay` | `/api/arena/replay` | ArenaEngine |
| Friends | Production Ready | ✅ | `/friends` | `/api/friends/*` | FriendEngine |
| Referrals | Production Ready | ✅ | `/referrals` | `/api/referrals` | ReferralEngine |
| Community | Production Ready | ✅ | `/community` | `/api/community` | CommunityEngine |
| Social Feed | Production Ready | ✅ | `/feed` | `/api/feed` | FeedEngine |
| Presence | Production Ready | ✅ | — | `/api/presence` | PresenceEngine |
| Invites | Production Ready | ✅ | — | `/api/invites` | InviteEngine |
| Seasons | Production Ready | ✅ | `/season` | `/api/seasons` | SeasonEngine |
| Live Events | Production Ready | ✅ | `/events` | `/api/events` | LiveOpsEngine |
| Campaigns | Production Ready | ✅ | Admin | `/api/campaigns` | CampaignEngine |
| Feature Flags | Production Ready | ✅ | Admin | `/api/feature-flags` | FeatureFlagEngine |
| Content/CMS | Production Ready | ✅ | Admin | `/api/content` | ContentEngine |
| Notifications | Production Ready | ✅ | — | `/api/notifications` | NotificationEngine |
| Animations | Production Ready | ✅ | — | `/api/animations` | UnlockAnimationEngine |
| Admin Console | Production Ready | ✅ | `apps/admin` | `/api/v1/admin/*` | AdminEngines |
| Observability | Beta | ✅ | Admin | `/api/v1/admin/metrics` etc. | ObservabilityEngines |
| Scheduler | Production Ready | ✅ | Admin | `/api/v1/admin/scheduler` | SchedulerEngine |
| Blockchain Sync | Dormant | ❌ | ❌ | — | BlockchainSyncService |
| On-chain Settlement | Planned | ❌ | ❌ | — | BlockchainService (stub) |
| ProgressionEngine v2 | Dormant | ❌ | ❌ | — | ProgressionEngine |
| Mission Rules DSL | Experimental | ❌ | ❌ | — | MissionRuleEngine |
| Legacy singular APIs | Dormant | 410 | — | `/api/spin` etc. | — |
| Spectator Mode | Beta | ✅ | Partial | `/api/arena` | SpectatorEngine |
| Global Admin Search | Beta | ✅ | Admin | `/api/v1/admin/search` | GlobalSearchEngine |
| Experiment Analytics | Beta | ✅ | Admin | `/api/v1/admin/experiments` | ExperimentAnalyticsEngine |

## Gameplay Flow Verification

| Journey | Status | Notes |
|---------|--------|-------|
| Prediction | ✅ Complete | UI → API → engines |
| Arena | ✅ Complete | Queue → match → result |
| Mission | ✅ Complete | Generate → progress → claim |
| Spin | ✅ Complete | Balance → spin → reward |
| Rewards | ✅ Complete | Claimable → claim |
| Leaderboard | ✅ Complete | Tournament scoring |
| Profile | ✅ Complete | Identity, badges, titles |
| Achievements | ✅ Complete | Unlock + animations |
| Friends | ✅ Complete | Request → accept |
| Referrals | ✅ Complete | Invite → milestone → reward |
| Community | ✅ Complete | Posts + announcements |

No broken flows identified in active paths. Blockchain/on-chain flows are intentionally disconnected.
