/*
  Warnings:

  - You are about to drop the column `assetId` on the `SpotOrder` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `SpotOrder` table. All the data in the column will be lost.
  - You are about to drop the `SpotHolding` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `symbol` to the `SpotOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `SpotOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SpotOrder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SpotOrderStatus" AS ENUM ('OPEN', 'FILLED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "SpotHolding" DROP CONSTRAINT "SpotHolding_assetId_fkey";

-- DropForeignKey
ALTER TABLE "SpotHolding" DROP CONSTRAINT "SpotHolding_userId_fkey";

-- DropForeignKey
ALTER TABLE "SpotOrder" DROP CONSTRAINT "SpotOrder_assetId_fkey";

-- AlterTable
ALTER TABLE "SpotOrder" DROP COLUMN "assetId",
DROP COLUMN "total",
ADD COLUMN     "filledQuantity" DECIMAL(20,8) NOT NULL DEFAULT 0,
ADD COLUMN     "status" "SpotOrderStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "symbol" TEXT NOT NULL,
ADD COLUMN     "type" "OrderType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "SpotHolding";

-- CreateTable
CREATE TABLE "SpotWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "locked" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotWallet_userId_currency_key" ON "SpotWallet"("userId", "currency");

-- CreateIndex
CREATE INDEX "SpotOrder_userId_status_idx" ON "SpotOrder"("userId", "status");

-- AddForeignKey
ALTER TABLE "SpotWallet" ADD CONSTRAINT "SpotWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Defense-in-depth, same reasoning as Wallet.balance and the earlier
-- SpotHolding.quantity constraint: the atomic conditional UPDATE ... WHERE
-- balance/locked >= x pattern in the application layer (app/api/spot/*)
-- is what actually prevents overspending under concurrent requests; these
-- are the last line of defense at the database level.
ALTER TABLE "SpotWallet" ADD CONSTRAINT "spot_wallet_balance_nonnegative" CHECK ("balance" >= 0);
ALTER TABLE "SpotWallet" ADD CONSTRAINT "spot_wallet_locked_nonnegative" CHECK ("locked" >= 0);
