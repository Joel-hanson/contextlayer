-- CreateEnum
CREATE TYPE "public"."FeedbackType" AS ENUM ('BUG', 'FEATURE', 'GENERAL', 'SUPPORT', 'SECURITY');

-- CreateEnum
CREATE TYPE "public"."FeedbackPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."FeedbackStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'DUPLICATE');

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "public"."FeedbackType" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "public"."FeedbackPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "contactEmail" TEXT,
    "pageUrl" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "adminResponse" TEXT,
    "assignedTo" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_userId_idx" ON "public"."feedback"("userId");

-- CreateIndex
CREATE INDEX "feedback_type_status_idx" ON "public"."feedback"("type", "status");

-- CreateIndex
CREATE INDEX "feedback_status_createdAt_idx" ON "public"."feedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_assignedTo_idx" ON "public"."feedback"("assignedTo");

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
