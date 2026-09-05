/*
  Warnings:

  - You are about to drop the column `agreementId` on the `tenants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bkashPaymentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AgreementStatus" ADD VALUE 'PENDING_APPROVAL';

-- DropIndex
DROP INDEX "payments_tenantProfileId_key";

-- DropIndex
DROP INDEX "tenants_agreementId_key";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bkashPaymentId" TEXT;

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "agreementId";

-- CreateIndex
CREATE UNIQUE INDEX "payments_bkashPaymentId_key" ON "payments"("bkashPaymentId");

-- CreateIndex
CREATE INDEX "payments_bkashPaymentId_idx" ON "payments"("bkashPaymentId");
