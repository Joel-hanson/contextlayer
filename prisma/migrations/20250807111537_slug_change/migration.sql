/*
  Warnings:

  - Added the required column `userId` to the `bridges` table without a default value. This is not possible if the table is not empty.
  - Made the column `slug` on table `bridges` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- AlterTable
ALTER TABLE "public"."bridges" ADD COLUMN     "userId" UUID NOT NULL,
ALTER COLUMN "slug" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT,
    "organization" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "autoSaveBridges" BOOLEAN NOT NULL DEFAULT true,
    "showAdvancedOptions" BOOLEAN NOT NULL DEFAULT false,
    "defaultAuthType" TEXT NOT NULL DEFAULT 'none',
    "defaultTimeout" INTEGER NOT NULL DEFAULT 30000,
    "defaultRetryAttempts" INTEGER NOT NULL DEFAULT 3,
    "enableCaching" BOOLEAN NOT NULL DEFAULT true,
    "cacheDuration" INTEGER NOT NULL DEFAULT 300,
    "enableRateLimiting" BOOLEAN NOT NULL DEFAULT false,
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 100,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "bridgeFailureAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReports" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceUpdates" BOOLEAN NOT NULL DEFAULT true,
    "webhookUrl" TEXT,
    "slackWebhookUrl" TEXT,
    "enableApiAccess" BOOLEAN NOT NULL DEFAULT false,
    "allowPublicAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "public"."verificationtokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "public"."verificationtokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "public"."user_settings"("userId");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bridges" ADD CONSTRAINT "bridges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
