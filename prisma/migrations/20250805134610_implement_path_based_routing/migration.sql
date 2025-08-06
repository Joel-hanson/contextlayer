-- CreateEnum
CREATE TYPE "public"."AuthenticationType" AS ENUM ('none', 'bearer', 'apikey', 'basic');

-- CreateEnum
CREATE TYPE "public"."HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

-- CreateEnum
CREATE TYPE "public"."ParameterType" AS ENUM ('string', 'number', 'boolean', 'object', 'array');

-- CreateEnum
CREATE TYPE "public"."BridgeStatus" AS ENUM ('active', 'inactive', 'error');

-- CreateTable
CREATE TABLE "public"."bridges" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "baseUrl" TEXT NOT NULL,
    "headers" JSONB,
    "authType" "public"."AuthenticationType" NOT NULL DEFAULT 'none',
    "authToken" TEXT,
    "authApiKey" TEXT,
    "authUsername" TEXT,
    "authPassword" TEXT,
    "authHeaderName" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."BridgeStatus" NOT NULL DEFAULT 'inactive',
    "routingType" TEXT NOT NULL DEFAULT 'path',
    "customDomain" TEXT,
    "pathPrefix" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "allowedOrigins" JSONB,
    "authRequired" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "performanceConfig" JSONB,
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
    "parameters" JSONB,
    "requestBody" JSONB,
    "responseSchema" JSONB,
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
    "headers" JSONB,
    "body" JSONB,
    "response" JSONB,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."api_endpoints" ADD CONSTRAINT "api_endpoints_bridgeId_fkey" FOREIGN KEY ("bridgeId") REFERENCES "public"."bridges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bridge_logs" ADD CONSTRAINT "bridge_logs_bridgeId_fkey" FOREIGN KEY ("bridgeId") REFERENCES "public"."bridges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_requests" ADD CONSTRAINT "api_requests_bridgeId_fkey" FOREIGN KEY ("bridgeId") REFERENCES "public"."bridges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_requests" ADD CONSTRAINT "api_requests_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "public"."api_endpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
