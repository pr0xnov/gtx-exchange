-- CreateTable
CREATE TABLE "SpotHolding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "total" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotHolding_userId_assetId_key" ON "SpotHolding"("userId", "assetId");

-- CreateIndex
CREATE INDEX "SpotOrder_userId_createdAt_idx" ON "SpotOrder"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SpotHolding" ADD CONSTRAINT "SpotHolding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotHolding" ADD CONSTRAINT "SpotHolding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotOrder" ADD CONSTRAINT "SpotOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotOrder" ADD CONSTRAINT "SpotOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Defense-in-depth, same reasoning as the Wallet.balance >= 0 constraint:
-- the atomic conditional UPDATE ... WHERE quantity >= x pattern in
-- app/api/spot/orders (SELL) is what actually prevents overselling a
-- holding under concurrent requests; this is the last line of defense at
-- the database level against any other write path.
ALTER TABLE "SpotHolding" ADD CONSTRAINT "spot_holding_quantity_nonnegative" CHECK ("quantity" >= 0);
