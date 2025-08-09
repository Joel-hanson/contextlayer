-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

-- CreateEnum
CREATE TYPE "public"."BridgeStatus" AS ENUM ('active', 'inactive', 'error');

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

-- CreateTable
CREATE TABLE "public"."bridges" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "baseUrl" TEXT NOT NULL,
    "authConfig" JSONB,
    "headers" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."BridgeStatus" NOT NULL DEFAULT 'inactive',
    "routingConfig" JSONB,
    "accessConfig" JSONB,
    "performanceConfig" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bridges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_endpoints" (
    "id" UUID NOT NULL,
    "bridgeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "method" "public"."HttpMethod" NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bridge_logs" (
    "id" UUID NOT NULL,
    "bridgeId" UUID NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bridge_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_requests" (
    "id" UUID NOT NULL,
    "bridgeId" UUID NOT NULL,
    "endpointId" UUID,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "requestData" JSONB,
    "responseData" JSONB,
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."access_tokens" (
    "id" UUID NOT NULL,
    "bridgeId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

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

-- CreateIndex
CREATE UNIQUE INDEX "bridges_slug_key" ON "public"."bridges"("slug");

-- CreateIndex
CREATE INDEX "bridges_userId_idx" ON "public"."bridges"("userId");

-- CreateIndex
CREATE INDEX "bridges_slug_idx" ON "public"."bridges"("slug");

-- CreateIndex
CREATE INDEX "bridges_status_enabled_idx" ON "public"."bridges"("status", "enabled");

-- CreateIndex
CREATE INDEX "bridges_userId_status_idx" ON "public"."bridges"("userId", "status");

-- CreateIndex
CREATE INDEX "api_endpoints_bridgeId_idx" ON "public"."api_endpoints"("bridgeId");

-- CreateIndex
CREATE INDEX "api_endpoints_bridgeId_method_path_idx" ON "public"."api_endpoints"("bridgeId", "method", "path");

-- CreateIndex
CREATE INDEX "bridge_logs_bridgeId_level_createdAt_idx" ON "public"."bridge_logs"("bridgeId", "level", "createdAt");

-- CreateIndex
CREATE INDEX "bridge_logs_level_createdAt_idx" ON "public"."bridge_logs"("level", "createdAt");

-- CreateIndex
CREATE INDEX "bridge_logs_createdAt_idx" ON "public"."bridge_logs"("createdAt");

-- CreateIndex
CREATE INDEX "api_requests_bridgeId_createdAt_idx" ON "public"."api_requests"("bridgeId", "createdAt");

-- CreateIndex
CREATE INDEX "api_requests_success_createdAt_idx" ON "public"."api_requests"("success", "createdAt");

-- CreateIndex
CREATE INDEX "api_requests_createdAt_idx" ON "public"."api_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "access_tokens_token_key" ON "public"."access_tokens"("token");

-- CreateIndex
CREATE INDEX "access_tokens_bridgeId_idx" ON "public"."access_tokens"("bridgeId");

-- CreateIndex
CREATE INDEX "access_tokens_token_idx" ON "public"."access_tokens"("token");

-- CreateIndex
CREATE INDEX "access_tokens_bridgeId_isActive_idx" ON "public"."access_tokens"("bridgeId", "isActive");

-- CreateIndex
CREATE INDEX "access_tokens_expiresAt_idx" ON "public"."access_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bridges" ADD CONSTRAINT "bridges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_endpoints" ADD CONSTRAINT "api_endpoints_bridgeId_fkey" FOREIGN KEY ("bridgeId") REFERENCES "public"."bridges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bridge_logs" ADD CONSTRAINT "bridge_logs_bridgeId_fkey" FOREIGN KEY ("bridgeId") REFERENCES "public"."bridges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_requests" ADD CONSTRAINT "api_requests_bridgeId_fkey" FOREIGN KEY ("bridgeId") REFERENCES "public"."bridges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_requests" ADD CONSTRAINT "api_requests_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "public"."api_endpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."access_tokens" ADD CONSTRAINT "access_tokens_bridgeId_fkey" FOREIGN KEY ("bridgeId") REFERENCES "public"."bridges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
