ALTER TYPE "actionType" ADD VALUE 'scheduling';--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY,
	"agentId" text NOT NULL,
	"conversationId" text,
	"channelId" text,
	"orgId" varchar(64) NOT NULL,
	"calBookingUid" text NOT NULL,
	"attendeeName" text NOT NULL,
	"attendeeEmail" text NOT NULL,
	"startTime" timestamp with time zone NOT NULL,
	"notes" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calcom_connections" (
	"id" text PRIMARY KEY,
	"orgId" varchar(64) NOT NULL UNIQUE,
	"calApiKey" text NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "demo_bookings" ADD COLUMN "category" text;--> statement-breakpoint
CREATE INDEX "appointments_agent_idx" ON "appointments" ("agentId");--> statement-breakpoint
CREATE INDEX "appointments_org_idx" ON "appointments" ("orgId");--> statement-breakpoint
CREATE INDEX "appointments_channel_idx" ON "appointments" ("channelId");--> statement-breakpoint
CREATE INDEX "calcom_connections_org_idx" ON "calcom_connections" ("orgId");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_agentId_agents_id_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_conversationId_conversations_id_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_channelId_channels_id_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL;