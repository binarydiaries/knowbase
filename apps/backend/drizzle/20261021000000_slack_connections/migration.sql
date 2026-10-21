-- Record the Slack schema that earlier deployments created directly.
ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'slack';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "slack_connections" (
  "id" text PRIMARY KEY,
  "orgId" varchar(64) NOT NULL UNIQUE,
  "botToken" text NOT NULL,
  "teamId" varchar(64) NOT NULL,
  "teamName" text NOT NULL,
  "botUserId" text NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slack_connections_org_idx" ON "slack_connections" ("orgId");
