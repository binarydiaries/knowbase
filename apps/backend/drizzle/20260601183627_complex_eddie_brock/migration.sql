CREATE TYPE "workflowActionType" AS ENUM('save_lead', 'api_trigger', 'calendar_booking');--> statement-breakpoint
CREATE TYPE "workflowExecutionMode" AS ENUM('sequential', 'parallel');--> statement-breakpoint
CREATE TABLE "workflow_actions" (
	"id" text PRIMARY KEY,
	"workflowId" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"actionType" "workflowActionType" NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" text PRIMARY KEY,
	"agentId" text NOT NULL,
	"name" text NOT NULL,
	"intentName" text NOT NULL,
	"requiredFields" text[] DEFAULT '{}'::text[] NOT NULL,
	"executionMode" "workflowExecutionMode" DEFAULT 'sequential'::"workflowExecutionMode" NOT NULL,
	"createdBy" varchar(64) NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "workflow_actions_workflow_idx" ON "workflow_actions" ("workflowId");--> statement-breakpoint
CREATE INDEX "workflows_agent_idx" ON "workflows" ("agentId");--> statement-breakpoint
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_workflowId_workflows_id_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_agentId_agents_id_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE;