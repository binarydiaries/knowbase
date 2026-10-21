CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "actionType" AS ENUM('lead_generation');--> statement-breakpoint
CREATE TYPE "agentStatus" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "tone" AS ENUM('friendly', 'professional', 'neutral');--> statement-breakpoint
CREATE TYPE "verbosity" AS ENUM('short', 'balanced', 'detailed');--> statement-breakpoint
CREATE TYPE "channelStatus" AS ENUM('inactive', 'active', 'error');--> statement-breakpoint
CREATE TYPE "type" AS ENUM('web', 'whatsapp', 'instagram');--> statement-breakpoint
CREATE TYPE "status" AS ENUM('ready', 'queue', 'indexing', 'indexed', 'failed');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TABLE "agent_actions" (
	"id" text PRIMARY KEY,
	"agentId" text NOT NULL,
	"actionType" "actionType" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"createdBy" varchar(64) NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_actions_agent_type_unique" UNIQUE("agentId","actionType")
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"agentStatus" "agentStatus" DEFAULT 'active'::"agentStatus" NOT NULL,
	"createdBy" varchar(64) NOT NULL,
	"orgId" varchar(64) NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_cost_events" (
	"id" text PRIMARY KEY,
	"orgId" varchar(64) NOT NULL,
	"agentId" text,
	"conversationId" text,
	"provider" varchar(64) NOT NULL,
	"model" varchar(128) NOT NULL,
	"inputTokens" integer DEFAULT 0 NOT NULL,
	"outputTokens" integer DEFAULT 0 NOT NULL,
	"cachedInputTokens" integer DEFAULT 0 NOT NULL,
	"totalTokens" integer DEFAULT 0 NOT NULL,
	"costUsd" numeric(12,6) NOT NULL,
	"metadata" jsonb,
	"occurredAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "behavior" (
	"id" text PRIMARY KEY,
	"agentId" text NOT NULL,
	"systemPrompt" text NOT NULL,
	"tone" "tone" DEFAULT 'neutral'::"tone" NOT NULL,
	"verbosity" "verbosity" DEFAULT 'balanced'::"verbosity" NOT NULL,
	"fallbackMessage" text NOT NULL,
	"guardrails" text,
	"createdBy" varchar(64) NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" text PRIMARY KEY,
	"agentId" text NOT NULL,
	"type" "type" NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"config" jsonb NOT NULL,
	"channelStatus" "channelStatus" DEFAULT 'inactive'::"channelStatus" NOT NULL,
	"usage" jsonb NOT NULL,
	"createdBy" varchar(64) NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY,
	"agentId" text NOT NULL,
	"channelId" text NOT NULL,
	"lastUserQuestion" text NOT NULL,
	"lastAssistantUtterance" text NOT NULL,
	"lastMessageAt" timestamp with time zone NOT NULL,
	"country" text,
	"topic" text,
	"externalId" text,
	"entities" jsonb,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"contentSerialized" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"type" text NOT NULL,
	"status" "status" DEFAULT 'ready'::"status" NOT NULL,
	"lastIndexedVersion" integer,
	"lastTrainedAt" timestamp with time zone,
	"agentId" text NOT NULL,
	"createdBy" varchar(64) NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" text PRIMARY KEY,
	"documentId" text NOT NULL,
	"documentVersion" integer NOT NULL,
	"chunkIndex" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY,
	"agentId" text NOT NULL,
	"conversationId" text,
	"channelId" text,
	"orgId" varchar(64) NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"company" text,
	"customFields" jsonb DEFAULT '{}' NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY,
	"conversationId" text NOT NULL,
	"role" "role" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"systemMetadata" jsonb,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_usage_daily" (
	"id" text PRIMARY KEY,
	"orgId" varchar(64) NOT NULL,
	"dateKey" text NOT NULL,
	"trainingRuns" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_usage_monthly" (
	"id" text PRIMARY KEY,
	"orgId" varchar(64) NOT NULL,
	"monthKey" text NOT NULL,
	"assistantMessages" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_connections" (
	"id" text PRIMARY KEY,
	"orgId" varchar(64) NOT NULL UNIQUE,
	"accessToken" text NOT NULL,
	"businessAccountId" text NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "agent_actions_agent_idx" ON "agent_actions" ("agentId");--> statement-breakpoint
CREATE INDEX "agents_org_idx" ON "agents" ("orgId");--> statement-breakpoint
CREATE INDEX "ai_cost_events_org_idx" ON "ai_cost_events" ("orgId");--> statement-breakpoint
CREATE INDEX "ai_cost_events_org_occurred_idx" ON "ai_cost_events" ("orgId","occurredAt");--> statement-breakpoint
CREATE INDEX "ai_cost_events_model_idx" ON "ai_cost_events" ("model");--> statement-breakpoint
CREATE UNIQUE INDEX "behavior_agent_unique" ON "behavior" ("agentId");--> statement-breakpoint
CREATE INDEX "channels_agent_idx" ON "channels" ("agentId");--> statement-breakpoint
CREATE INDEX "conversations_agent_idx" ON "conversations" ("agentId");--> statement-breakpoint
CREATE INDEX "conversations_agent_lastmsg_idx" ON "conversations" ("agentId","lastMessageAt");--> statement-breakpoint
CREATE INDEX "conversations_channel_external_idx" ON "conversations" ("channelId","externalId");--> statement-breakpoint
CREATE INDEX "documents_agent_idx" ON "documents" ("agentId");--> statement-breakpoint
CREATE INDEX "documents_agent_status_idx" ON "documents" ("agentId","status");--> statement-breakpoint
CREATE INDEX "embeddingIndex" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "leads_agent_idx" ON "leads" ("agentId");--> statement-breakpoint
CREATE INDEX "leads_org_idx" ON "leads" ("orgId");--> statement-breakpoint
CREATE INDEX "leads_channel_idx" ON "leads" ("channelId");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "messages" ("conversationId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "org_usage_daily_org_day_unique" ON "org_usage_daily" ("orgId","dateKey");--> statement-breakpoint
CREATE INDEX "org_usage_daily_org_idx" ON "org_usage_daily" ("orgId");--> statement-breakpoint
CREATE UNIQUE INDEX "org_usage_monthly_org_month_unique" ON "org_usage_monthly" ("orgId","monthKey");--> statement-breakpoint
CREATE INDEX "org_usage_monthly_org_idx" ON "org_usage_monthly" ("orgId");--> statement-breakpoint
CREATE INDEX "wa_connections_org_idx" ON "whatsapp_connections" ("orgId");--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_agentId_agents_id_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "behavior" ADD CONSTRAINT "behavior_agentId_agents_id_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id");--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_agentId_agents_id_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agentId_agents_id_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channelId_channels_id_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_agentId_agents_id_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id");--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_documentId_documents_id_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_agentId_agents_id_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_conversationId_conversations_id_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_channelId_channels_id_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_conversations_id_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id");