/*
  Warnings:

  - You are about to drop the column `rentalAgreementId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ownerId]` on the table `properties` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "owners" DROP CONSTRAINT "owners_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_rentalAgreementId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "rentalAgreementId",
ADD COLUMN     "agreementId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "properties_ownerId_key" ON "properties"("ownerId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
