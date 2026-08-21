-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VerificationDocument" ADD COLUMN     "fileData" BYTEA,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "rejectionReason" TEXT;
