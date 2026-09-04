-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'FIRST_DEPOSIT_BONUS';

-- CreateTable
CREATE TABLE "FirstDepositBonus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "depositTransactionId" TEXT NOT NULL,
    "depositAmount" DECIMAL(20,8) NOT NULL,
    "bonusAmount" DECIMAL(20,8) NOT NULL,
    "bonusTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirstDepositBonus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FirstDepositBonus_userId_key" ON "FirstDepositBonus"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FirstDepositBonus_depositTransactionId_key" ON "FirstDepositBonus"("depositTransactionId");

-- AddForeignKey
ALTER TABLE "FirstDepositBonus" ADD CONSTRAINT "FirstDepositBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

