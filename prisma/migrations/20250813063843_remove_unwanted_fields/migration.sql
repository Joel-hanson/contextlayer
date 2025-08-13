/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `bridges` table. All the data in the column will be lost.
  - You are about to drop the column `performanceConfig` on the `bridges` table. All the data in the column will be lost.
  - You are about to drop the column `routingConfig` on the `bridges` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `bridges` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."bridges_status_enabled_idx";

-- DropIndex
DROP INDEX "public"."bridges_userId_status_idx";

-- AlterTable
ALTER TABLE "public"."bridges" DROP COLUMN "deletedAt",
DROP COLUMN "performanceConfig",
DROP COLUMN "routingConfig",
DROP COLUMN "status",
ALTER COLUMN "enabled" SET DEFAULT true;

-- DropEnum
DROP TYPE "public"."BridgeStatus";

-- CreateIndex
CREATE INDEX "bridges_enabled_idx" ON "public"."bridges"("enabled");
