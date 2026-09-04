/*
  Warnings:

  - You are about to drop the column `address` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "address",
ALTER COLUMN "agreementId" DROP NOT NULL;
