-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "proofData" BYTEA,
ADD COLUMN     "proofFileName" TEXT,
ADD COLUMN     "proofMimeType" TEXT;
