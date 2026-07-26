-- CreateTable
CREATE TABLE IF NOT EXISTS "SkillBoostPayment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "txHash" VARCHAR(66) NOT NULL,
    "asset" VARCHAR(16) NOT NULL,
    "amountWei" VARCHAR(78) NOT NULL,
    "purpose" VARCHAR(32) NOT NULL,
    "matchId" UUID,
    "expiresAt" TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBoostPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SkillBoostPayment_txHash_key" ON "SkillBoostPayment"("txHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SkillBoostPayment_userId_purpose_expiresAt_idx" ON "SkillBoostPayment"("userId", "purpose", "expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SkillBoostPayment_userId_verified_createdAt_idx" ON "SkillBoostPayment"("userId", "verified", "createdAt");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SkillBoostPayment_userId_fkey'
  ) THEN
    ALTER TABLE "SkillBoostPayment"
      ADD CONSTRAINT "SkillBoostPayment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
