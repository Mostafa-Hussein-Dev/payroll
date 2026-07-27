/*
  Warnings:

  - You are about to drop the column `nssfRate` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "nssfRate",
ADD COLUMN     "nssfMode" TEXT NOT NULL DEFAULT 'percent',
ADD COLUMN     "nssfValue" DECIMAL(14,2) NOT NULL DEFAULT 0;
