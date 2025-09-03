-- AlterTable
ALTER TABLE "public"."bridges" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "bridges_isPublic_enabled_idx" ON "public"."bridges"("isPublic", "enabled");
