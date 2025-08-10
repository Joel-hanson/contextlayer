-- AlterTable
ALTER TABLE "public"."bridges" ADD COLUMN     "mcpPrompts" JSONB,
ADD COLUMN     "mcpResources" JSONB,
ADD COLUMN     "mcpTools" JSONB;
