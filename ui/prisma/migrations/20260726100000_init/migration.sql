-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'SHADOW_BANNED');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('UPCOMING', 'OPEN', 'LOCKED', 'EVALUATING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PENDING', 'EVALUATED', 'REWARDED');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LOGIN', 'PREDICTION', 'MISSION', 'SPIN', 'REWARD', 'SOCIAL', 'TOURNAMENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'REWARD', 'SYSTEM', 'ALERT');

-- CreateEnum
CREATE TYPE "SpinType" AS ENUM ('DAILY', 'REWARD', 'PURCHASE', 'EVENT');

-- CreateEnum
CREATE TYPE "MissionCategory" AS ENUM ('DAILY', 'WEEKLY', 'MILESTONE', 'HIDDEN', 'SEASONAL');

-- CreateEnum
CREATE TYPE "RewardAssetType" AS ENUM ('XP', 'POINTS', 'SPINS', 'CELO', 'USDT', 'USDM');

-- CreateEnum
CREATE TYPE "StatisticType" AS ENUM ('PREDICTIONS_SUBMITTED', 'PREDICTIONS_WON', 'PREDICTION_ACCURACY', 'XP_EARNED', 'POINTS_EARNED', 'REWARDS_EARNED', 'SPINS_EARNED', 'SPINS_USED', 'LOGIN_DAYS', 'CURRENT_STREAK', 'LONGEST_STREAK', 'MISSION_COMPLETION_PERCENTAGE', 'TOURNAMENT_WINS', 'LEADERBOARD_FINISHES', 'ARENA_MATCHES', 'ARENA_WINS');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RefreshTokenStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GameExecStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "RewardPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('TOURNAMENT_CREATED', 'TOURNAMENT_STARTED', 'TOURNAMENT_LOCKED', 'EVALUATION_STARTED', 'EVALUATION_COMPLETED', 'REWARD_GENERATED', 'REWARD_PAID', 'REWARD_FAILED', 'SETTINGS_CHANGED', 'AUTH_FAILED', 'ADMIN_ACTION', 'PREDICTION_SUBMITTED', 'PREDICTION_EVALUATED', 'MISSION_CREATED', 'MISSION_COMPLETED', 'MISSION_CLAIMED', 'NOTIFICATION_SENT', 'NOTIFICATION_READ', 'STREAK_UPDATED', 'CACHE_INVALIDATED', 'SETTLEMENT_RETRY', 'SPIN_STARTED', 'SPIN_COMPLETED', 'REWARD_CLAIMED');

-- CreateEnum
CREATE TYPE "RewardSource" AS ENUM ('TOURNAMENT', 'MISSION', 'DAILY_LOGIN', 'STREAK', 'SPIN', 'ADMIN', 'REFERRAL');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('DAILY', 'WEEKLY', 'LIFETIME', 'HIDDEN', 'LEGENDARY', 'SEASONAL', 'COMMUNITY', 'REFERRAL', 'TOURNAMENT', 'SKILL');

-- CreateEnum
CREATE TYPE "AchievementRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'MASTER', 'LEGEND');

-- CreateEnum
CREATE TYPE "TitleRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "RuleLogic" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('BLOCKED', 'MUTED', 'FRIEND');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'PLAYING_TOURNAMENT', 'SPINNING', 'VIEWING_LEADERBOARD', 'AWAY', 'INVISIBLE', 'ARENA_SEARCHING', 'ARENA_PLAYING', 'ARENA_SPECTATING');

-- CreateEnum
CREATE TYPE "FeedItemType" AS ENUM ('ACHIEVEMENT', 'REWARD', 'TOURNAMENT', 'BADGE', 'MISSION', 'REFERRAL', 'SYSTEM', 'FRIEND_REQUEST', 'PRESENCE', 'LEVEL_UP', 'SPIN', 'ARENA_VICTORY', 'ARENA_MATCH');

-- CreateEnum
CREATE TYPE "CommunityPostType" AS ENUM ('ANNOUNCEMENT', 'FEATURED', 'HIGHLIGHT', 'CHAMPION', 'SEASONAL', 'FEATURED_TOURNAMENT', 'FEATURED_PLAYER', 'FEATURED_ACHIEVEMENT', 'WEEKLY_SPOTLIGHT');

-- CreateEnum
CREATE TYPE "InviteType" AS ENUM ('DEEP_LINK', 'INVITE_CODE', 'QR', 'MINIPAY');

-- CreateEnum
CREATE TYPE "ReferralMilestone" AS ENUM ('REGISTERED', 'FIRST_PREDICTION', 'FIRST_TOURNAMENT', 'THIRD_ACTIVE_DAY', 'FIRST_REWARD');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "FeedPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'PINNED');

-- CreateEnum
CREATE TYPE "ReferralFraudStatus" AS ENUM ('CLEAR', 'FLAGGED', 'REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "ArenaQueueStatus" AS ENUM ('SEARCHING', 'MATCHED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ArenaMatchStatus" AS ENUM ('WAITING', 'ACCEPTED', 'COUNTDOWN', 'PLAYING', 'FINISHED', 'SETTLING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArenaMatchType" AS ENUM ('PREDICTION_DUEL', 'TRIVIA', 'PUZZLE', 'STRATEGY', 'REACTION', 'CREATOR_EVENT');

-- CreateEnum
CREATE TYPE "ArenaQueueMode" AS ENUM ('QUICK_MATCH', 'FRIEND_CHALLENGE', 'INVITE_CODE', 'PRIVATE_MATCH', 'REMATCH', 'TOURNAMENT_QUEUE');

-- CreateEnum
CREATE TYPE "ArenaPresenceStatus" AS ENUM ('SEARCHING', 'MATCHED', 'PLAYING', 'SPECTATING', 'OFFLINE');

-- CreateEnum
CREATE TYPE "MatchOutcome" AS ENUM ('WIN', 'LOSS', 'DRAW');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('PRESEASON', 'ACTIVE', 'ENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('ONBOARDING', 'RETENTION', 'REENGAGEMENT', 'REFERRAL', 'SEASON_LAUNCH', 'LIVE_EVENT');

-- CreateEnum
CREATE TYPE "LiveEventType" AS ENUM ('WEEKEND', 'HOLIDAY', 'DOUBLE_XP', 'DOUBLE_SPINS', 'SPECIAL_TOURNAMENT', 'COMMUNITY_CHALLENGE', 'CREATOR', 'FLASH_MISSIONS', 'ARENA_MODE');

-- CreateEnum
CREATE TYPE "LiveEventStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContentBlockType" AS ENUM ('HERO_BANNER', 'ANNOUNCEMENT', 'PROMO_CARD', 'ARENA_HIGHLIGHT', 'COMMUNITY_SPOTLIGHT', 'REWARD_PROMO');

-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('HOME_HERO', 'ARENA', 'SEASON', 'EVENTS', 'GLOBAL');

-- CreateEnum
CREATE TYPE "ScheduledJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'DEAD_LETTER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduledJobType" AS ENUM ('SEASON_ROLLOVER', 'CAMPAIGN_START', 'CAMPAIGN_END', 'BANNER_PUBLISH', 'FEATURE_ACTIVATION', 'TOURNAMENT_GENERATE', 'MISSION_REFRESH', 'LEADERBOARD_SNAPSHOT', 'REWARD_PROCESSING', 'CLEANUP', 'MATCH_EXPIRE', 'QUEUE_EXPIRE');

-- CreateEnum
CREATE TYPE "FeatureFlagTarget" AS ENUM ('GLOBAL', 'PERCENTAGE', 'WHITELIST', 'REGION', 'MINIPAY', 'ENVIRONMENT', 'EXPERIMENT');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'GAME_OPERATOR', 'CONTENT_EDITOR', 'SUPPORT', 'ANALYST', 'FINANCE', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'APPEALED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'SILENCED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "wallet" VARCHAR(42) NOT NULL,
    "username" VARCHAR(64),
    "avatar" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "spins" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "currentRank" INTEGER,
    "lastLogin" TIMESTAMP,
    "totalActivity" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'UPCOMING',
    "rewardPool" INTEGER NOT NULL,
    "asset" VARCHAR(42) NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "seasonNumber" INTEGER NOT NULL,
    "dailyNumber" INTEGER NOT NULL,
    "actualValue" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "predictionValue" INTEGER NOT NULL,
    "submittedValue" INTEGER,
    "actualValue" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "rankPoints" INTEGER NOT NULL DEFAULT 0,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "status" "PredictionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMission" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "pointReward" INTEGER NOT NULL,
    "spinReward" INTEGER NOT NULL,
    "missionType" VARCHAR(64) NOT NULL,
    "category" "MissionCategory" NOT NULL DEFAULT 'DAILY',
    "targetValue" INTEGER NOT NULL,
    "config" JSONB,
    "status" "MissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "DailyMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "category" "MissionCategory" NOT NULL DEFAULT 'DAILY',
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "targetValue" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP,
    "claimable" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "UserMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionReward" (
    "id" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "rewardType" "RewardAssetType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinLedger" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "spinType" "SpinType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "transactionHash" VARCHAR(66),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpinLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardLedger" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reward" VARCHAR(120) NOT NULL,
    "asset" VARCHAR(42) NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "transactionHash" VARCHAR(66),
    "treasuryRequestId" VARCHAR(66),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" UUID NOT NULL,
    "tournamentId" UUID,
    "userId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "predictionAccuracy" DOUBLE PRECISION,
    "snapshotTime" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "expiresAt" TIMESTAMP,
    "scheduledAt" TIMESTAMP,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "deliveryStatus" VARCHAR(32),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameExecution" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "engineVersion" VARCHAR(64) NOT NULL,
    "status" "GameExecStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP,
    "errors" JSONB,
    "metadata" JSONB,

    CONSTRAINT "GameExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingReward" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tournamentId" UUID,
    "predictionId" UUID,
    "reward" VARCHAR(120) NOT NULL,
    "asset" VARCHAR(42) NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "treasuryRequestId" VARCHAR(66),
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "transactionHash" VARCHAR(66),
    "txAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "PendingReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actor" VARCHAR(42),
    "action" VARCHAR(120) NOT NULL,
    "entity" VARCHAR(120),
    "entityId" VARCHAR(42),
    "eventId" VARCHAR(42),
    "sessionId" VARCHAR(42),
    "correlationId" VARCHAR(64),
    "metadata" JSONB,
    "recordHash" VARCHAR(64),
    "previousHash" VARCHAR(64),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "wallet" VARCHAR(42) NOT NULL,
    "refreshToken" VARCHAR(128) NOT NULL,
    "userAgent" VARCHAR(255),
    "ip" VARCHAR(45),
    "expiresAt" TIMESTAMP NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "replacedBy" VARCHAR(128),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStatistic" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "StatisticType" NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "PlayerStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventType" VARCHAR(64) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channels" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL DEFAULT 'DAILY',
    "rarity" "AchievementRarity" NOT NULL DEFAULT 'COMMON',
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "pointsReward" INTEGER NOT NULL DEFAULT 0,
    "icon" VARCHAR(120),
    "criteria" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementRule" (
    "id" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "groupId" UUID,
    "statType" "StatisticType" NOT NULL,
    "operator" VARCHAR(16) NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "windowDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AchievementRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementRuleGroup" (
    "id" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "logic" "RuleLogic" NOT NULL DEFAULT 'AND',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AchievementRuleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL DEFAULT 1,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "tier" "BadgeTier" NOT NULL DEFAULT 'BRONZE',
    "icon" VARCHAR(120),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Title" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "rarity" "TitleRarity" NOT NULL DEFAULT 'COMMON',
    "requirement" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarFrame" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "rarity" "TitleRarity" NOT NULL DEFAULT 'COMMON',
    "cssClass" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "AvatarFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerIdentity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" VARCHAR(64),
    "selectedTitle" VARCHAR(120),
    "selectedBadge" VARCHAR(120),
    "selectedFrame" VARCHAR(120),
    "theme" VARCHAR(32),
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "PlayerIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerIdentityVersion" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "displayName" VARCHAR(64),
    "selectedTitle" VARCHAR(120),
    "selectedBadge" VARCHAR(120),
    "selectedFrame" VARCHAR(120),
    "theme" VARCHAR(32),
    "snapshot" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerIdentityVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressSnapshot" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "snapshotType" VARCHAR(64) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockAnimation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "referenceId" VARCHAR(42),
    "payload" JSONB,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "priority" VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
    "interrupt" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlockAnimation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "id" UUID NOT NULL,
    "identifier" VARCHAR(120) NOT NULL,
    "endpoint" VARCHAR(120) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEvent" (
    "id" UUID NOT NULL,
    "aggregateId" VARCHAR(42) NOT NULL,
    "aggregateType" VARCHAR(64) NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "payload" JSONB,
    "occurredAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinReward" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "asset" VARCHAR(42) NOT NULL,
    "amount" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "rarity" VARCHAR(32) NOT NULL,
    "config" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "SpinReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinHistory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "spinRewardId" UUID,
    "reward" VARCHAR(120) NOT NULL,
    "asset" VARCHAR(42) NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "transactionHash" VARCHAR(66),
    "seed" VARCHAR(64),
    "randomNumber" VARCHAR(64),
    "weightUsed" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpinHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardClaim" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reward" VARCHAR(120) NOT NULL,
    "asset" VARCHAR(42) NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "transactionHash" VARCHAR(66),
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardQueue" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reward" VARCHAR(120) NOT NULL,
    "asset" VARCHAR(42) NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "RewardSource" NOT NULL,
    "reason" TEXT,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "RewardPriority" NOT NULL DEFAULT 'NORMAL',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "deadLetter" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "RewardQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardSourceCatalog" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardSourceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" VARCHAR(280),
    "respondedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "friendId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" UUID NOT NULL,
    "referrerId" UUID NOT NULL,
    "referredId" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "fraudStatus" "ReferralFraudStatus" NOT NULL DEFAULT 'CLEAR',
    "fraudScore" INTEGER NOT NULL DEFAULT 0,
    "deviceHash" VARCHAR(64),
    "ipHash" VARCHAR(64),
    "flaggedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" UUID NOT NULL,
    "referralId" UUID NOT NULL,
    "milestone" "ReferralMilestone" NOT NULL,
    "rewardType" VARCHAR(32) NOT NULL,
    "amount" INTEGER NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "shortCode" VARCHAR(8),
    "type" "InviteType" NOT NULL DEFAULT 'INVITE_CODE',
    "url" TEXT,
    "deepLink" TEXT,
    "usedBy" UUID,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "type" "CommunityPostType" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "referenceId" VARCHAR(64),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "actorId" UUID,
    "type" "FeedItemType" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "referenceType" VARCHAR(64),
    "referenceId" VARCHAR(64),
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "priority" "FeedPriority" NOT NULL DEFAULT 'NORMAL',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "rankScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "PresenceStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastActive" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresenceSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deviceId" VARCHAR(64) NOT NULL,
    "deviceType" VARCHAR(32) NOT NULL DEFAULT 'WEB',
    "status" "PresenceStatus" NOT NULL DEFAULT 'ONLINE',
    "lastActive" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresenceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralFraudSignal" (
    "id" UUID NOT NULL,
    "referralId" UUID NOT NULL,
    "signalType" VARCHAR(64) NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralFraudSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRelationship" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "relatedId" UUID NOT NULL,
    "type" "RelationshipType" NOT NULL DEFAULT 'BLOCKED',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialSettings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "profileVisibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "activityVisibility" "Visibility" NOT NULL DEFAULT 'FRIENDS',
    "onlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "friendRequests" BOOLEAN NOT NULL DEFAULT true,
    "referralVisibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "SocialSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arena" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL DEFAULT 'NEXORA Arena',
    "seasonNumber" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Arena_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaMatch" (
    "id" UUID NOT NULL,
    "arenaId" UUID,
    "matchType" "ArenaMatchType" NOT NULL DEFAULT 'PREDICTION_DUEL',
    "status" "ArenaMatchStatus" NOT NULL DEFAULT 'WAITING',
    "mode" "ArenaQueueMode" NOT NULL DEFAULT 'QUICK_MATCH',
    "inviteCode" VARCHAR(16),
    "targetValue" INTEGER,
    "metadata" JSONB,
    "startedAt" TIMESTAMP,
    "finishedAt" TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "ArenaMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaQueue" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "matchId" UUID,
    "mode" "ArenaQueueMode" NOT NULL DEFAULT 'QUICK_MATCH',
    "matchType" "ArenaMatchType" NOT NULL DEFAULT 'PREDICTION_DUEL',
    "status" "ArenaQueueStatus" NOT NULL DEFAULT 'SEARCHING',
    "rating" INTEGER NOT NULL DEFAULT 1000,
    "expiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "ArenaQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaInvitation" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "prediction" INTEGER,
    "score" DOUBLE PRECISION,
    "outcome" "MatchOutcome",
    "ratingBefore" INTEGER,
    "ratingAfter" INTEGER,
    "rewardEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaResult" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "winnerId" UUID,
    "loserId" UUID,
    "isDraw" BOOLEAN NOT NULL DEFAULT false,
    "auditHash" VARCHAR(64) NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "settledAt" TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaReplay" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "timeline" JSONB NOT NULL,
    "statistics" JSONB,
    "result" JSONB,
    "compressed" BOOLEAN NOT NULL DEFAULT false,
    "compressionFormat" VARCHAR(16),
    "checkpoints" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaReplay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaRating" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skillRating" INTEGER NOT NULL DEFAULT 1000,
    "ratingDeviation" DOUBLE PRECISION NOT NULL DEFAULT 350,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "league" VARCHAR(32) NOT NULL DEFAULT 'BRONZE',
    "seasonNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "ArenaRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaSeasonStatistic" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "peakRating" INTEGER NOT NULL DEFAULT 1000,
    "rewardsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "ArenaSeasonStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaPresence" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "ArenaPresenceStatus" NOT NULL DEFAULT 'OFFLINE',
    "matchId" VARCHAR(64),
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "ArenaPresence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaStateMachineDefinition" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "states" JSONB NOT NULL,
    "transitions" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "ArenaStateMachineDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaAnalyticsMetric" (
    "id" UUID NOT NULL,
    "metricType" VARCHAR(64) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaAnalyticsMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "SeasonStatus" NOT NULL DEFAULT 'PRESEASON',
    "startAt" TIMESTAMP NOT NULL,
    "endAt" TIMESTAMP NOT NULL,
    "preseasonAt" TIMESTAMP,
    "config" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonTier" (
    "id" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "tierLevel" INTEGER NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "xpRequired" INTEGER NOT NULL,
    "rewardType" VARCHAR(32) NOT NULL,
    "rewardAmount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SeasonTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonReward" (
    "id" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "tierLevel" INTEGER NOT NULL,
    "rewardType" VARCHAR(32) NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" VARCHAR(160),

    CONSTRAINT "SeasonReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonMission" (
    "id" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "bonusXp" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SeasonMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonLeaderboard" (
    "id" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "snapshotAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonLeaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "seasonXp" INTEGER NOT NULL DEFAULT 0,
    "seasonRank" INTEGER NOT NULL DEFAULT 0,
    "tierLevel" INTEGER NOT NULL DEFAULT 0,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "rewardsClaimed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SeasonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveEvent" (
    "id" UUID NOT NULL,
    "seasonId" UUID,
    "type" "LiveEventType" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "LiveEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startAt" TIMESTAMP NOT NULL,
    "endAt" TIMESTAMP NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" UUID NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "targetType" "FeatureFlagTarget" NOT NULL DEFAULT 'GLOBAL',
    "percentage" INTEGER,
    "whitelist" JSONB,
    "regions" JSONB,
    "environments" JSONB,
    "minipayOnly" BOOLEAN NOT NULL DEFAULT false,
    "experimentGroups" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" UUID NOT NULL,
    "type" "ContentBlockType" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "ctaLabel" VARCHAR(64),
    "ctaUrl" TEXT,
    "placement" "BannerPlacement" NOT NULL DEFAULT 'HOME_HERO',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP,
    "endAt" TIMESTAMP,
    "audience" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "locale" VARCHAR(8) NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" UUID NOT NULL,
    "contentId" UUID,
    "title" VARCHAR(160) NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT,
    "ctaLabel" VARCHAR(64),
    "ctaUrl" TEXT,
    "placement" "BannerPlacement" NOT NULL DEFAULT 'HOME_HERO',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP,
    "endAt" TIMESTAMP,
    "audience" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "locale" VARCHAR(8) NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannerDismissal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bannerId" UUID NOT NULL,
    "dismissedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannerDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementSchedule" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" UUID NOT NULL,
    "seasonId" UUID,
    "type" "CampaignType" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP,
    "endAt" TIMESTAMP,
    "config" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignVersion" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdBy" VARCHAR(42),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignTarget" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "userId" UUID,
    "segment" VARCHAR(64),
    "metadata" JSONB,

    CONSTRAINT "CampaignTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJob" (
    "id" UUID NOT NULL,
    "jobType" "ScheduledJobType" NOT NULL,
    "status" "ScheduledJobStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP NOT NULL,
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" VARCHAR(120),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJobDependency" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "dependsOnJobId" UUID NOT NULL,

    CONSTRAINT "ScheduledJobDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationReport" (
    "id" UUID NOT NULL,
    "reporterId" UUID,
    "targetUserId" UUID,
    "targetPostId" UUID,
    "type" VARCHAR(64) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "resolvedBy" VARCHAR(42),
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" UUID NOT NULL,
    "wallet" VARCHAR(42) NOT NULL,
    "role" "AdminRole" NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "deviceFingerprint" VARCHAR(128),
    "ipAddress" VARCHAR(45),
    "ipHistory" JSONB,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" UUID NOT NULL,
    "wallet" VARCHAR(42) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'READ_ONLY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSeries" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "tags" JSONB,
    "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryEvent" (
    "id" UUID NOT NULL,
    "source" VARCHAR(64) NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "traceId" VARCHAR(64),
    "spanId" VARCHAR(64),
    "parentSpanId" VARCHAR(64),
    "correlationId" VARCHAR(64),
    "durationMs" INTEGER,
    "payload" JSONB,
    "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "metricName" VARCHAR(120) NOT NULL,
    "condition" VARCHAR(32) NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "silenceUntil" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertIncident" (
    "id" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "acknowledgedBy" VARCHAR(42),
    "acknowledgedAt" TIMESTAMP,
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" UUID NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "trendPct" DOUBLE PRECISION,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'LOW',
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "capturedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemHealth" (
    "id" UUID NOT NULL,
    "component" VARCHAR(64) NOT NULL,
    "status" "HealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "latencyMs" DOUBLE PRECISION,
    "metadata" JSONB,
    "checkedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDependency" (
    "id" UUID NOT NULL,
    "service" VARCHAR(64) NOT NULL,
    "dependsOn" VARCHAR(64) NOT NULL,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "ServiceDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraceSpan" (
    "id" UUID NOT NULL,
    "traceId" VARCHAR(64) NOT NULL,
    "spanId" VARCHAR(64) NOT NULL,
    "parentSpanId" VARCHAR(64),
    "operation" VARCHAR(120) NOT NULL,
    "service" VARCHAR(64) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "metadata" JSONB,
    "startedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "TraceSpan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditIntegrity" (
    "id" UUID NOT NULL,
    "auditLogId" UUID NOT NULL,
    "recordHash" VARCHAR(64) NOT NULL,
    "previousHash" VARCHAR(64),
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditIntegrity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentResult" (
    "id" UUID NOT NULL,
    "flagKey" VARCHAR(64) NOT NULL,
    "variant" VARCHAR(16) NOT NULL,
    "metricName" VARCHAR(120) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlagVersion" (
    "id" UUID NOT NULL,
    "flagKey" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" VARCHAR(42),
    "rollbackOf" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlagVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPolicy" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "role" "AdminRole" NOT NULL,
    "permission" VARCHAR(64) NOT NULL,
    "condition" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerMetric" (
    "id" UUID NOT NULL,
    "jobId" UUID,
    "jobType" VARCHAR(64) NOT NULL,
    "runtimeMs" INTEGER NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "dependencyWaitMs" INTEGER,
    "queueDelayMs" INTEGER,
    "success" BOOLEAN NOT NULL,
    "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchedulerMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_wallet_key" ON "UserProfile"("wallet");

-- CreateIndex
CREATE INDEX "UserProfile_wallet_idx" ON "UserProfile"("wallet");

-- CreateIndex
CREATE INDEX "UserProfile_status_idx" ON "UserProfile"("status");

-- CreateIndex
CREATE INDEX "Tournament_status_startTime_idx" ON "Tournament"("status", "startTime");

-- CreateIndex
CREATE INDEX "Tournament_seasonNumber_dailyNumber_idx" ON "Tournament"("seasonNumber", "dailyNumber");

-- CreateIndex
CREATE INDEX "Prediction_tournamentId_userId_idx" ON "Prediction"("tournamentId", "userId");

-- CreateIndex
CREATE INDEX "Prediction_userId_status_idx" ON "Prediction"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_tournamentId_userId_key" ON "Prediction"("tournamentId", "userId");

-- CreateIndex
CREATE INDEX "DailyMission_category_status_idx" ON "DailyMission"("category", "status");

-- CreateIndex
CREATE INDEX "DailyMission_status_startDate_idx" ON "DailyMission"("status", "startDate");

-- CreateIndex
CREATE INDEX "UserMission_userId_completed_idx" ON "UserMission"("userId", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "UserMission_userId_missionId_key" ON "UserMission"("userId", "missionId");

-- CreateIndex
CREATE INDEX "MissionReward_missionId_idx" ON "MissionReward"("missionId");

-- CreateIndex
CREATE INDEX "SpinLedger_userId_createdAt_idx" ON "SpinLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardLedger_userId_createdAt_idx" ON "RewardLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardLedger_treasuryRequestId_idx" ON "RewardLedger"("treasuryRequestId");

-- CreateIndex
CREATE INDEX "Activity_userId_type_createdAt_idx" ON "Activity"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_tournamentId_snapshotTime_idx" ON "LeaderboardSnapshot"("tournamentId", "snapshotTime");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_userId_snapshotTime_idx" ON "LeaderboardSnapshot"("userId", "snapshotTime");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_priority_createdAt_idx" ON "Notification"("userId", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_scheduledAt_idx" ON "Notification"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE INDEX "GameExecution_tournamentId_status_idx" ON "GameExecution"("tournamentId", "status");

-- CreateIndex
CREATE INDEX "PendingReward_userId_status_idx" ON "PendingReward"("userId", "status");

-- CreateIndex
CREATE INDEX "PendingReward_treasuryRequestId_idx" ON "PendingReward"("treasuryRequestId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_eventId_idx" ON "AuditLog"("eventId");

-- CreateIndex
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

-- CreateIndex
CREATE INDEX "AuditLog_recordHash_idx" ON "AuditLog"("recordHash");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_userId_revoked_expiresAt_idx" ON "Session"("userId", "revoked", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_sessionId_key" ON "RefreshToken"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_sessionId_revoked_expiresAt_idx" ON "RefreshToken"("sessionId", "revoked", "expiresAt");

-- CreateIndex
CREATE INDEX "PlayerStatistic_userId_type_idx" ON "PlayerStatistic"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStatistic_userId_type_key" ON "PlayerStatistic"("userId", "type");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_eventType_key" ON "NotificationPreference"("userId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");

-- CreateIndex
CREATE INDEX "AchievementRule_achievementId_idx" ON "AchievementRule"("achievementId");

-- CreateIndex
CREATE INDEX "AchievementRule_statType_idx" ON "AchievementRule"("statType");

-- CreateIndex
CREATE INDEX "AchievementRuleGroup_achievementId_idx" ON "AchievementRuleGroup"("achievementId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_unlocked_idx" ON "UserAchievement"("userId", "unlocked");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_slug_key" ON "Badge"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Title_slug_key" ON "Title"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AvatarFrame_slug_key" ON "AvatarFrame"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerIdentity_userId_key" ON "PlayerIdentity"("userId");

-- CreateIndex
CREATE INDEX "PlayerIdentityVersion_userId_version_idx" ON "PlayerIdentityVersion"("userId", "version");

-- CreateIndex
CREATE INDEX "ProgressSnapshot_userId_snapshotType_createdAt_idx" ON "ProgressSnapshot"("userId", "snapshotType", "createdAt");

-- CreateIndex
CREATE INDEX "UnlockAnimation_userId_viewed_idx" ON "UnlockAnimation"("userId", "viewed");

-- CreateIndex
CREATE INDEX "UnlockAnimation_userId_priority_idx" ON "UnlockAnimation"("userId", "priority");

-- CreateIndex
CREATE INDEX "RateLimitEntry_identifier_endpoint_createdAt_idx" ON "RateLimitEntry"("identifier", "endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitEntry_expiresAt_idx" ON "RateLimitEntry"("expiresAt");

-- CreateIndex
CREATE INDEX "DomainEvent_aggregateId_occurredAt_idx" ON "DomainEvent"("aggregateId", "occurredAt");

-- CreateIndex
CREATE INDEX "DomainEvent_eventType_processed_idx" ON "DomainEvent"("eventType", "processed");

-- CreateIndex
CREATE INDEX "DomainEvent_occurredAt_idx" ON "DomainEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "SpinHistory_userId_createdAt_idx" ON "SpinHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardClaim_userId_createdAt_idx" ON "RewardClaim"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardQueue_userId_status_idx" ON "RewardQueue"("userId", "status");

-- CreateIndex
CREATE INDEX "RewardQueue_status_scheduledAt_idx" ON "RewardQueue"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "RewardQueue_status_priority_idx" ON "RewardQueue"("status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "RewardSourceCatalog_name_key" ON "RewardSourceCatalog"("name");

-- CreateIndex
CREATE INDEX "FriendRequest_receiverId_status_idx" ON "FriendRequest"("receiverId", "status");

-- CreateIndex
CREATE INDEX "FriendRequest_senderId_status_idx" ON "FriendRequest"("senderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverId_key" ON "FriendRequest"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Friendship_friendId_idx" ON "Friendship"("friendId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userId_friendId_key" ON "Friendship"("userId", "friendId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_fraudStatus_idx" ON "Referral"("fraudStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "ReferralReward_referralId_claimed_idx" ON "ReferralReward"("referralId", "claimed");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_referralId_milestone_key" ON "ReferralReward"("referralId", "milestone");

-- CreateIndex
CREATE INDEX "InviteCode_ownerId_idx" ON "InviteCode"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_shortCode_key" ON "InviteCode"("shortCode");

-- CreateIndex
CREATE INDEX "CommunityPost_type_active_createdAt_idx" ON "CommunityPost"("type", "active", "createdAt");

-- CreateIndex
CREATE INDEX "FeedItem_userId_pinned_rankScore_createdAt_idx" ON "FeedItem"("userId", "pinned", "rankScore", "createdAt");

-- CreateIndex
CREATE INDEX "FeedItem_type_createdAt_idx" ON "FeedItem"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Presence_status_idx" ON "Presence"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_userId_key" ON "Presence"("userId");

-- CreateIndex
CREATE INDEX "PresenceSession_userId_lastActive_idx" ON "PresenceSession"("userId", "lastActive");

-- CreateIndex
CREATE UNIQUE INDEX "PresenceSession_userId_deviceId_key" ON "PresenceSession"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "ReferralFraudSignal_referralId_signalType_idx" ON "ReferralFraudSignal"("referralId", "signalType");

-- CreateIndex
CREATE INDEX "PlayerRelationship_userId_type_idx" ON "PlayerRelationship"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRelationship_userId_relatedId_type_key" ON "PlayerRelationship"("userId", "relatedId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SocialSettings_userId_key" ON "SocialSettings"("userId");

-- CreateIndex
CREATE INDEX "Arena_active_seasonNumber_idx" ON "Arena"("active", "seasonNumber");

-- CreateIndex
CREATE INDEX "ArenaMatch_status_createdAt_idx" ON "ArenaMatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ArenaMatch_inviteCode_idx" ON "ArenaMatch"("inviteCode");

-- CreateIndex
CREATE INDEX "ArenaQueue_status_matchType_rating_idx" ON "ArenaQueue"("status", "matchType", "rating");

-- CreateIndex
CREATE INDEX "ArenaQueue_userId_status_idx" ON "ArenaQueue"("userId", "status");

-- CreateIndex
CREATE INDEX "ArenaInvitation_receiverId_accepted_idx" ON "ArenaInvitation"("receiverId", "accepted");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaInvitation_code_key" ON "ArenaInvitation"("code");

-- CreateIndex
CREATE INDEX "MatchParticipant_userId_createdAt_idx" ON "MatchParticipant"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_userId_key" ON "MatchParticipant"("matchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaResult_matchId_key" ON "ArenaResult"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaReplay_matchId_key" ON "ArenaReplay"("matchId");

-- CreateIndex
CREATE INDEX "ArenaRating_skillRating_idx" ON "ArenaRating"("skillRating");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaRating_userId_seasonNumber_key" ON "ArenaRating"("userId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaSeasonStatistic_userId_seasonNumber_key" ON "ArenaSeasonStatistic"("userId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaPresence_userId_key" ON "ArenaPresence"("userId");

-- CreateIndex
CREATE INDEX "ArenaPresence_status_idx" ON "ArenaPresence"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaStateMachineDefinition_name_key" ON "ArenaStateMachineDefinition"("name");

-- CreateIndex
CREATE INDEX "ArenaAnalyticsMetric_metricType_recordedAt_idx" ON "ArenaAnalyticsMetric"("metricType", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Season_number_key" ON "Season"("number");

-- CreateIndex
CREATE INDEX "Season_status_startAt_idx" ON "Season"("status", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonTier_seasonId_tierLevel_key" ON "SeasonTier"("seasonId", "tierLevel");

-- CreateIndex
CREATE INDEX "SeasonReward_seasonId_tierLevel_idx" ON "SeasonReward"("seasonId", "tierLevel");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonMission_seasonId_missionId_key" ON "SeasonMission"("seasonId", "missionId");

-- CreateIndex
CREATE INDEX "SeasonLeaderboard_seasonId_rank_idx" ON "SeasonLeaderboard"("seasonId", "rank");

-- CreateIndex
CREATE INDEX "SeasonLeaderboard_seasonId_userId_idx" ON "SeasonLeaderboard"("seasonId", "userId");

-- CreateIndex
CREATE INDEX "SeasonProgress_seasonId_seasonXp_idx" ON "SeasonProgress"("seasonId", "seasonXp");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonProgress_userId_seasonId_key" ON "SeasonProgress"("userId", "seasonId");

-- CreateIndex
CREATE INDEX "LiveEvent_status_startAt_idx" ON "LiveEvent"("status", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_enabled_idx" ON "FeatureFlag"("key", "enabled");

-- CreateIndex
CREATE INDEX "ContentBlock_type_active_placement_priority_idx" ON "ContentBlock"("type", "active", "placement", "priority");

-- CreateIndex
CREATE INDEX "Banner_placement_active_priority_idx" ON "Banner"("placement", "active", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "BannerDismissal_userId_bannerId_key" ON "BannerDismissal"("userId", "bannerId");

-- CreateIndex
CREATE INDEX "AnnouncementSchedule_scheduledAt_published_idx" ON "AnnouncementSchedule"("scheduledAt", "published");

-- CreateIndex
CREATE INDEX "Campaign_status_startAt_idx" ON "Campaign"("status", "startAt");

-- CreateIndex
CREATE INDEX "CampaignVersion_campaignId_version_idx" ON "CampaignVersion"("campaignId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignVersion_campaignId_version_key" ON "CampaignVersion"("campaignId", "version");

-- CreateIndex
CREATE INDEX "CampaignTarget_campaignId_idx" ON "CampaignTarget"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignTarget_userId_idx" ON "CampaignTarget"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJob_idempotencyKey_key" ON "ScheduledJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ScheduledJob_status_scheduledAt_idx" ON "ScheduledJob"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledJob_jobType_status_idx" ON "ScheduledJob"("jobType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJobDependency_jobId_dependsOnJobId_key" ON "ScheduledJobDependency"("jobId", "dependsOnJobId");

-- CreateIndex
CREATE INDEX "ModerationReport_status_createdAt_idx" ON "ModerationReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationReport_targetUserId_idx" ON "ModerationReport"("targetUserId");

-- CreateIndex
CREATE INDEX "ModerationReport_targetPostId_idx" ON "ModerationReport"("targetPostId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "AdminSession_wallet_revoked_expiresAt_idx" ON "AdminSession"("wallet", "revoked", "expiresAt");

-- CreateIndex
CREATE INDEX "AdminSession_deviceFingerprint_idx" ON "AdminSession"("deviceFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_wallet_key" ON "AdminPermission"("wallet");

-- CreateIndex
CREATE INDEX "AdminPermission_role_active_idx" ON "AdminPermission"("role", "active");

-- CreateIndex
CREATE INDEX "MetricSeries_name_recordedAt_idx" ON "MetricSeries"("name", "recordedAt");

-- CreateIndex
CREATE INDEX "TelemetryEvent_source_recordedAt_idx" ON "TelemetryEvent"("source", "recordedAt");

-- CreateIndex
CREATE INDEX "TelemetryEvent_traceId_idx" ON "TelemetryEvent"("traceId");

-- CreateIndex
CREATE INDEX "TelemetryEvent_correlationId_idx" ON "TelemetryEvent"("correlationId");

-- CreateIndex
CREATE INDEX "AlertRule_enabled_metricName_idx" ON "AlertRule"("enabled", "metricName");

-- CreateIndex
CREATE INDEX "AlertIncident_status_severity_createdAt_idx" ON "AlertIncident"("status", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "Insight_category_createdAt_idx" ON "Insight"("category", "createdAt");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_capturedAt_idx" ON "DashboardSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "SystemHealth_component_checkedAt_idx" ON "SystemHealth"("component", "checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDependency_service_dependsOn_key" ON "ServiceDependency"("service", "dependsOn");

-- CreateIndex
CREATE INDEX "TraceSpan_traceId_startedAt_idx" ON "TraceSpan"("traceId", "startedAt");

-- CreateIndex
CREATE INDEX "TraceSpan_spanId_idx" ON "TraceSpan"("spanId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditIntegrity_auditLogId_key" ON "AuditIntegrity"("auditLogId");

-- CreateIndex
CREATE INDEX "AuditIntegrity_recordHash_idx" ON "AuditIntegrity"("recordHash");

-- CreateIndex
CREATE INDEX "ExperimentResult_flagKey_variant_recordedAt_idx" ON "ExperimentResult"("flagKey", "variant", "recordedAt");

-- CreateIndex
CREATE INDEX "FeatureFlagVersion_flagKey_version_idx" ON "FeatureFlagVersion"("flagKey", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlagVersion_flagKey_version_key" ON "FeatureFlagVersion"("flagKey", "version");

-- CreateIndex
CREATE INDEX "AdminPolicy_role_permission_active_idx" ON "AdminPolicy"("role", "permission", "active");

-- CreateIndex
CREATE INDEX "SchedulerMetric_jobType_recordedAt_idx" ON "SchedulerMetric"("jobType", "recordedAt");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "DailyMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionReward" ADD CONSTRAINT "MissionReward_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "DailyMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpinLedger" ADD CONSTRAINT "SpinLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardLedger" ADD CONSTRAINT "RewardLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameExecution" ADD CONSTRAINT "GameExecution_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingReward" ADD CONSTRAINT "PendingReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingReward" ADD CONSTRAINT "PendingReward_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStatistic" ADD CONSTRAINT "PlayerStatistic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementRule" ADD CONSTRAINT "AchievementRule_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementRule" ADD CONSTRAINT "AchievementRule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AchievementRuleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementRuleGroup" ADD CONSTRAINT "AchievementRuleGroup_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerIdentity" ADD CONSTRAINT "PlayerIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerIdentityVersion" ADD CONSTRAINT "PlayerIdentityVersion_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "PlayerIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressSnapshot" ADD CONSTRAINT "ProgressSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockAnimation" ADD CONSTRAINT "UnlockAnimation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpinHistory" ADD CONSTRAINT "SpinHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpinHistory" ADD CONSTRAINT "SpinHistory_spinRewardId_fkey" FOREIGN KEY ("spinRewardId") REFERENCES "SpinReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardClaim" ADD CONSTRAINT "RewardClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresenceSession" ADD CONSTRAINT "PresenceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralFraudSignal" ADD CONSTRAINT "ReferralFraudSignal_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRelationship" ADD CONSTRAINT "PlayerRelationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRelationship" ADD CONSTRAINT "PlayerRelationship_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialSettings" ADD CONSTRAINT "SocialSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaMatch" ADD CONSTRAINT "ArenaMatch_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaQueue" ADD CONSTRAINT "ArenaQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaQueue" ADD CONSTRAINT "ArenaQueue_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ArenaMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaInvitation" ADD CONSTRAINT "ArenaInvitation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ArenaMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaInvitation" ADD CONSTRAINT "ArenaInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaInvitation" ADD CONSTRAINT "ArenaInvitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ArenaMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaResult" ADD CONSTRAINT "ArenaResult_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ArenaMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaReplay" ADD CONSTRAINT "ArenaReplay_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ArenaMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaRating" ADD CONSTRAINT "ArenaRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaSeasonStatistic" ADD CONSTRAINT "ArenaSeasonStatistic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaPresence" ADD CONSTRAINT "ArenaPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonTier" ADD CONSTRAINT "SeasonTier_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonReward" ADD CONSTRAINT "SeasonReward_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonMission" ADD CONSTRAINT "SeasonMission_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonLeaderboard" ADD CONSTRAINT "SeasonLeaderboard_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonProgress" ADD CONSTRAINT "SeasonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonProgress" ADD CONSTRAINT "SeasonProgress_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveEvent" ADD CONSTRAINT "LiveEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerDismissal" ADD CONSTRAINT "BannerDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerDismissal" ADD CONSTRAINT "BannerDismissal_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignVersion" ADD CONSTRAINT "CampaignVersion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTarget" ADD CONSTRAINT "CampaignTarget_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTarget" ADD CONSTRAINT "CampaignTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledJobDependency" ADD CONSTRAINT "ScheduledJobDependency_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScheduledJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledJobDependency" ADD CONSTRAINT "ScheduledJobDependency_dependsOnJobId_fkey" FOREIGN KEY ("dependsOnJobId") REFERENCES "ScheduledJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertIncident" ADD CONSTRAINT "AlertIncident_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
