-- AlterEnum
ALTER TYPE "AgreementStatus" ADD VALUE 'PENDING_TERMINATION';

-- AlterTable
ALTER TABLE "agreements" ADD COLUMN     "terminationReason" TEXT,
ADD COLUMN     "terminationRequestedAt" TIMESTAMP(3);
