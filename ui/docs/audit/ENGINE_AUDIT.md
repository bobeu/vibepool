# Engine Audit — Prompt 15

**Total engines:** 50+ classes across 64 files

## Status Legend

- **ACTIVE** — Used in production API/service flows
- **DORMANT** — Implemented, disconnected or unused
- **EXPERIMENTAL** — Available but not default at launch
- **LEGACY** — Superseded stub

## Core Gameplay Engines

| Engine | Status | Usage | Performance | Future Value |
|--------|--------|-------|-------------|--------------|
| ActivityEngine | ACTIVE | All activity recording | Low | High |
| MissionEngine | ACTIVE | Daily missions API | Medium | High |
| ProgressEngine | ACTIVE | EventBus → mission progress | Medium | High |
| StreakEngine | ACTIVE | Login streak API | Low | High |
| SpinEngine | ACTIVE | Spin balance | Low | High |
| WheelEngine | ACTIVE | Spin execution | Medium | High |
| RewardClaimEngine | ACTIVE | Reward claims | Medium | High |
| GamificationEngine | ACTIVE | Level/rank/progression | Low | High |
| NotificationEngine | ACTIVE | Notifications | Low | High |
| StatisticsEngine | ACTIVE | Player stats | Low | Medium |

## Tournament Pipeline

| Engine | Status | Usage |
|--------|--------|-------|
| PredictionEngine | ACTIVE | `/api/predictions` |
| ScoringEngine | ACTIVE | GameEngine pipeline |
| RankingEngine | ACTIVE | Leaderboard |
| GameEngine | ACTIVE | Tournament evaluation |
| XPRewardEngine | ACTIVE | XP calculation |
| RewardEngine | ACTIVE | Reward generation |
| SettlementEngine | ACTIVE | Settlement |
| AuditEngine | ACTIVE | Hash-chained audit logs |

## Arena

| Engine | Status | Usage |
|--------|--------|-------|
| ArenaEngine | ACTIVE | Arena home, rating, presence |
| MatchmakingEngine | ACTIVE | Queue, invites |
| MatchEngine | ACTIVE | Match lifecycle |
| ResultEngine | ACTIVE | Match finalization |
| SpectatorEngine | ACTIVE | Live matches |
| SimpleRatingStrategy | ACTIVE | Default rating |
| Elo/Glicko/TrueSkill | EXPERIMENTAL | On-demand only |

## Social

| Engine | Status | Usage |
|--------|--------|-------|
| FriendEngine | ACTIVE | Friends API |
| ReferralEngine | ACTIVE | Referrals + EventBus |
| ReferralFraudEngine | ACTIVE | InviteEngine dependency |
| CommunityEngine | ACTIVE | Community posts |
| PresenceEngine | ACTIVE | Presence API |
| FeedEngine | ACTIVE | Social feed |
| InviteEngine | ACTIVE | Invite codes |
| UnlockAnimationEngine | ACTIVE | Animation queue |
| SocialSettingsEngine | ACTIVE | Privacy settings |

## LiveOps

| Engine | Status | Usage |
|--------|--------|-------|
| SeasonEngine | ACTIVE | Seasons API + EventBus |
| ContentEngine | ACTIVE | CMS blocks |
| FeatureFlagEngine | ACTIVE | Flags + experiments |
| LiveOpsEngine | ACTIVE | Events, banners |
| SchedulerEngine | ACTIVE | Job queue (via schedulerRegistry) |
| CampaignEngine | ACTIVE | Campaign lifecycle |

## Observability (Admin)

| Engine | Status | Usage |
|--------|--------|-------|
| MetricsEngine | ACTIVE | Admin metrics API |
| TelemetryEngine | ACTIVE | Telemetry events |
| AnalyticsEngine | ACTIVE | DAU/WAU/MAU collection |
| ObservabilityEngine | ACTIVE | Health dashboard |
| AlertEngine | ACTIVE | Alert rules/incidents |
| InsightEngine | ACTIVE | Auto insights |
| AnomalyEngine | ACTIVE | Z-score detection |
| GlobalSearchEngine | ACTIVE | Admin search |
| ExperimentAnalyticsEngine | ACTIVE | A/B/C comparison |

## Admin Ops

| Engine | Status | Usage |
|--------|--------|-------|
| AdminDashboardEngine | ACTIVE | Admin dashboard |
| UserManagementEngine | ACTIVE | User admin |
| ModerationEngine | ACTIVE | Moderation |
| AdminAnalyticsEngine | ACTIVE | Admin analytics |
| ArenaOpsEngine | ACTIVE | Arena admin |

## Dormant / Legacy

| Engine | Status | Reason |
|--------|--------|--------|
| ProgressionEngine | DORMANT | Zero imports |
| MissionRuleEngine | DORMANT | Tests only |
| BlockchainService (serviceImpl) | LEGACY | Stub throws |

## Infrastructure

| Module | Status | Notes |
|--------|--------|-------|
| EventBus | ACTIVE | 28 subscribers in serviceImpl |
| EventStore | ACTIVE | Persists domain events |
| SecureRandomProvider | ACTIVE | Spin fairness |

## Performance Notes

- EventBus subscribers run sequentially per event — arena match completion is heaviest (DB + feed + season XP)
- FeatureFlagEngine caches 30s TTL — good for read-heavy paths
- Scheduler CLEANUP handler dynamically imports MatchEngine — reduces cold start
