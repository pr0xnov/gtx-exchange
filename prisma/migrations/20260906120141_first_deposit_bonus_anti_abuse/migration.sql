-- AlterTable
ALTER TABLE "FirstDepositBonus" ADD COLUMN     "claimDeviceHash" TEXT,
ADD COLUMN     "claimIp" TEXT,
ADD COLUMN     "reviewReason" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastKnownDeviceHash" TEXT,
ADD COLUMN     "lastKnownIp" TEXT;

-- CreateIndex
CREATE INDEX "FirstDepositBonus_claimIp_idx" ON "FirstDepositBonus"("claimIp");
