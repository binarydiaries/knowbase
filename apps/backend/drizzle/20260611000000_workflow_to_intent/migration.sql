-- Rename tables
ALTER TABLE "workflows" RENAME TO "intents";
ALTER TABLE "workflow_actions" RENAME TO "intent_actions";

-- intents: drop old display-name column, rename routing slug column to "name"
ALTER TABLE "intents" DROP COLUMN "name";
ALTER TABLE "intents" RENAME COLUMN "intentName" TO "name";

-- intent_actions: rename workflowId → intentId
ALTER TABLE "intent_actions" RENAME COLUMN "workflowId" TO "intentId";

-- Rename PG enums
ALTER TYPE "workflowExecutionMode" RENAME TO "intentExecutionMode";
ALTER TYPE "workflowActionType" RENAME TO "intentActionType";

-- Add send_email to intentActionType (was missing from the DB enum)
ALTER TYPE "intentActionType" ADD VALUE IF NOT EXISTS 'send_email';

-- Rename indexes
ALTER INDEX "workflows_agent_idx" RENAME TO "intents_agent_idx";
ALTER INDEX "workflow_actions_workflow_idx" RENAME TO "intent_actions_intent_idx";
