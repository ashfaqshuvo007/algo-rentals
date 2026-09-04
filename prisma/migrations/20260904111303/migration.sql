/*
  Warnings:

  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[propertyId]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_rentalAgreementId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_tenantProfileId_fkey";

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "propertyId" TEXT;

-- DropTable
DROP TABLE "Payment";

-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tenantProfileId" TEXT,
    "rentalAgreementId" TEXT,
    "type" "PaymentType" NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'BKASH',
    "amount" DECIMAL(65,30) NOT NULL,
    "bkashTransactionId" TEXT,
    "gatewayResponse" JSONB,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owners_email_key" ON "owners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "owners_userId_key" ON "owners"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "owners_propertyId_key" ON "owners"("propertyId");

-- CreateIndex
CREATE INDEX "idx_owner_email" ON "owners"("email");

-- CreateIndex
CREATE INDEX "idx_owner_isDeleted" ON "owners"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "payments_tenantProfileId_key" ON "payments"("tenantProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bkashTransactionId_key" ON "payments"("bkashTransactionId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_bkashTransactionId_idx" ON "payments"("bkashTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_propertyId_key" ON "tenants"("propertyId");

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rentalAgreementId_fkey" FOREIGN KEY ("rentalAgreementId") REFERENCES "agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
