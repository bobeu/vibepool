-- Stackable inventory for Speed Shielder / Quick Buzzer purchases
ALTER TABLE "UserInventoryItem"
ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;

-- Admin-configurable speed item economics
ALTER TABLE "SpinConfig"
ADD COLUMN IF NOT EXISTS "speedShielderBasePriceWei" VARCHAR(78) NOT NULL DEFAULT '2000000000000000';

ALTER TABLE "SpinConfig"
ADD COLUMN IF NOT EXISTS "quickBuzzerBasePriceWei" VARCHAR(78) NOT NULL DEFAULT '2000000000000000';

ALTER TABLE "SpinConfig"
ADD COLUMN IF NOT EXISTS "rpmReductionPerShielder" INTEGER NOT NULL DEFAULT 2;

ALTER TABLE "SpinConfig"
ADD COLUMN IF NOT EXISTS "minWheelRpm" INTEGER NOT NULL DEFAULT 40;
