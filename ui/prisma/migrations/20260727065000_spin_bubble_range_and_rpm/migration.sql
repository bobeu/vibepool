-- Add configurable minimum bubble payout and align default wheel speed.
ALTER TABLE "SpinConfig"
ADD COLUMN IF NOT EXISTS "minBubbleCashWei" VARCHAR(78) NOT NULL DEFAULT '10000000000000';

ALTER TABLE "SpinConfig"
ALTER COLUMN "baseWheelRpm" SET DEFAULT 100;

UPDATE "SpinConfig"
SET "baseWheelRpm" = 100
WHERE "baseWheelRpm" = 120;
