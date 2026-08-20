-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailChangeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailChangeTokenHash" TEXT,
ADD COLUMN     "pendingEmail" TEXT;

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "apiKeyPublic",
DROP COLUMN "apiKeySecret",
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailChangeTokenHash_key" ON "User"("emailChangeTokenHash");

