/*
  Warnings:

  - You are about to drop the column `propertyId` on the `tenants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[unitId]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_propertyId_fkey";

-- DropIndex
DROP INDEX "tenants_propertyId_key";

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "propertyId",
ADD COLUMN     "unitId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_unitId_key" ON "tenants"("unitId");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
