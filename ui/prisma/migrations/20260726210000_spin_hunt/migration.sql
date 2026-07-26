-- CreateEnum
CREATE TYPE "SpinMusicTier" AS ENUM ('FREE', 'PREMIUM', 'GOLD');
CREATE TYPE "SpinItemType" AS ENUM ('SPEED_SHIELDER', 'BUZZER', 'MUSIC', 'OTHER');
CREATE TYPE "SpinSessionStatus" AS ENUM ('ACTIVE', 'FINISHED', 'CANCELLED');
CREATE TYPE "SpinRewardPendingStatus" AS ENUM ('PENDING_SYNC', 'CREDITED_ONCHAIN', 'WITHDRAWN');
CREATE TYPE "SpinRewardSource" AS ENUM ('BUBBLE', 'WHEEL');

CREATE TABLE IF NOT EXISTS "SpinConfig" (
    "id" UUID NOT NULL,
    "key" VARCHAR(64) NOT NULL DEFAULT 'default',
    "treasuryBps" INTEGER NOT NULL DEFAULT 7000,
    "entryFeeWei" VARCHAR(78) NOT NULL DEFAULT '10000000000000000',
    "entryAsset" VARCHAR(16) NOT NULL DEFAULT 'USDm',
    "xpCostPerSpin" INTEGER NOT NULL DEFAULT 0,
    "spinDurationSec" INTEGER NOT NULL DEFAULT 10,
    "maxBubbleCashWei" VARCHAR(78) NOT NULL DEFAULT '1000000000000000',
    "maxCashPerSpinWei" VARCHAR(78) NOT NULL DEFAULT '50000000000000000',
    "baseWheelRpm" INTEGER NOT NULL DEFAULT 120,
    "metadata" JSONB,
    "updatedAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpinConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SpinConfig_key_key" ON "SpinConfig"("key");

CREATE TABLE IF NOT EXISTS "SpinMusicTrack" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "artist" VARCHAR(120),
    "url" TEXT NOT NULL,
    "tier" "SpinMusicTier" NOT NULL DEFAULT 'FREE',
    "priceWei" VARCHAR(78) NOT NULL DEFAULT '0',
    "priceAsset" VARCHAR(16) NOT NULL DEFAULT 'USDm',
    "durationSec" INTEGER NOT NULL DEFAULT 15,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "SpinMusicTrack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserMusicInventory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "trackId" UUID NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserMusicInventory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserMusicInventory_userId_trackId_key" ON "UserMusicInventory"("userId", "trackId");
CREATE INDEX IF NOT EXISTS "UserMusicInventory_userId_equipped_idx" ON "UserMusicInventory"("userId", "equipped");

CREATE TABLE IF NOT EXISTS "SpinCollectionItem" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "SpinItemType" NOT NULL DEFAULT 'OTHER',
    "tier" INTEGER NOT NULL DEFAULT 1,
    "priceWei" VARCHAR(78) NOT NULL DEFAULT '0',
    "priceAsset" VARCHAR(16) NOT NULL DEFAULT 'USDm',
    "effect" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "SpinCollectionItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SpinCollectionItem_slug_key" ON "SpinCollectionItem"("slug");

CREATE TABLE IF NOT EXISTS "UserInventoryItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserInventoryItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserInventoryItem_userId_itemId_key" ON "UserInventoryItem"("userId", "itemId");
CREATE INDEX IF NOT EXISTS "UserInventoryItem_userId_equipped_idx" ON "UserInventoryItem"("userId", "equipped");

CREATE TABLE IF NOT EXISTS "SpinSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "SpinSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "entryTxHash" VARCHAR(66),
    "entryAsset" VARCHAR(16),
    "serverSeed" VARCHAR(64) NOT NULL,
    "loadout" JSONB,
    "bubblePlan" JSONB,
    "cashEarnedWei" VARCHAR(78) NOT NULL DEFAULT '0',
    "cashAsset" VARCHAR(16) NOT NULL DEFAULT 'USDm',
    "wheelRewardId" UUID,
    "startedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP,
    "expiresAt" TIMESTAMP NOT NULL,
    CONSTRAINT "SpinSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SpinSession_userId_status_idx" ON "SpinSession"("userId", "status");
CREATE INDEX IF NOT EXISTS "SpinSession_status_expiresAt_idx" ON "SpinSession"("status", "expiresAt");

CREATE TABLE IF NOT EXISTS "BubbleHit" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bubbleId" VARCHAR(64) NOT NULL,
    "amountWei" VARCHAR(78) NOT NULL,
    "asset" VARCHAR(16) NOT NULL,
    "taps" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BubbleHit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BubbleHit_sessionId_bubbleId_key" ON "BubbleHit"("sessionId", "bubbleId");
CREATE INDEX IF NOT EXISTS "BubbleHit_userId_createdAt_idx" ON "BubbleHit"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "SpinRewardPending" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "wallet" VARCHAR(42) NOT NULL,
    "sessionId" UUID,
    "asset" VARCHAR(16) NOT NULL,
    "amountWei" VARCHAR(78) NOT NULL,
    "requestId" VARCHAR(66) NOT NULL,
    "source" "SpinRewardSource" NOT NULL DEFAULT 'BUBBLE',
    "status" "SpinRewardPendingStatus" NOT NULL DEFAULT 'PENDING_SYNC',
    "creditTxHash" VARCHAR(66),
    "withdrawTxHash" VARCHAR(66),
    "lastError" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "SpinRewardPending_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SpinRewardPending_requestId_key" ON "SpinRewardPending"("requestId");
CREATE INDEX IF NOT EXISTS "SpinRewardPending_userId_status_idx" ON "SpinRewardPending"("userId", "status");
CREATE INDEX IF NOT EXISTS "SpinRewardPending_status_createdAt_idx" ON "SpinRewardPending"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "SpinRewardPending_wallet_asset_status_idx" ON "SpinRewardPending"("wallet", "asset", "status");

DO $$ BEGIN
  ALTER TABLE "UserMusicInventory" ADD CONSTRAINT "UserMusicInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "UserMusicInventory" ADD CONSTRAINT "UserMusicInventory_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "SpinMusicTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "UserInventoryItem" ADD CONSTRAINT "UserInventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "UserInventoryItem" ADD CONSTRAINT "UserInventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SpinCollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "SpinSession" ADD CONSTRAINT "SpinSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BubbleHit" ADD CONSTRAINT "BubbleHit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SpinSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BubbleHit" ADD CONSTRAINT "BubbleHit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "SpinRewardPending" ADD CONSTRAINT "SpinRewardPending_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "SpinRewardPending" ADD CONSTRAINT "SpinRewardPending_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SpinSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
