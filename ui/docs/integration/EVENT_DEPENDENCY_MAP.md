# Event Dependency Map — Prompt 16

## Active Subscribers (serviceImpl.ts)

| Event | Producer(s) | Consumer Action |
|-------|-------------|-----------------|
| ActivityRecorded | ActivityEngine | ProgressEngine, referral milestones |
| StreakUpdated | StreakEngine | StatisticsEngine |
| SpinGranted | SpinEngine | StatisticsEngine |
| FriendRequestSent | FriendEngine | Notification, Feed |
| FriendAccepted | FriendEngine | Notification, Feed (both) |
| ReferralCompleted | ReferralEngine | Notification, Feed |
| ReferralRegistered | InviteEngine | Milestone, Notification |
| AchievementUnlocked | AchievementEngine | Animation, Notification, Feed |
| CommunityAnnouncement | CommunityEngine | Notification |
| BadgeEquipped / TitleEquipped | Profile engines | Feed |
| ArenaMatchFound | MatchmakingEngine | Notification, Presence |
| ArenaInvitationSent | ArenaEngine | Notification |
| ArenaMatchCompleted | ResultEngine | Season XP, Activity, Stats, Feed |
| ArenaRewardEligible | ResultEngine | XP/points increment |
| ArenaQueueJoined / ArenaMatchStarted | Matchmaking/Match | Presence |
| ReferralFlagged | ReferralFraudEngine | Notification |
| SeasonStarted/Ended | SeasonEngine | Public feed |
| FeatureFlagChanged | FeatureFlagEngine | Logger |
| CampaignStarted/Completed | CampaignEngine | Feed / Logger |
| BannerPublished | LiveOpsEngine | Feed |
| LiveEventStarted/Ended | LiveOpsEngine | Feed / Logger |

## Published — No Subscriber (Documented, Not Removed)

| Event | Producer |
|-------|----------|
| MissionAvailable/Completed/Claimed | MissionEngine |
| SpinCompleted | WheelEngine |
| RewardClaimed | RewardClaimEngine |
| FeedItemCreated | FeedEngine |
| ArenaMatchAccepted/Countdown/Declined/PredictionSubmitted | MatchEngine |
| ArenaPresenceChanged | ArenaEngine |
| ArenaMetricRecorded | ArenaAnalytics |
| NotificationQueued/Read | NotificationEngine |

## Disconnected (Prompt 15)

| Event | Reason |
|-------|--------|
| PresenceChanged | Gated off in productionConfig |

## Retry Behavior

EventBus handlers run synchronously in-process; failures log errors. No automatic retry queue — **blocker for scale** (see BLOCKERS.md).
