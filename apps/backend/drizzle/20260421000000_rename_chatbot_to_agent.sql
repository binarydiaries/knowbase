-- Rename chatbots table to agents
ALTER TABLE chatbots RENAME TO agents;

-- Rename chatbot_actions table to agent_actions
ALTER TABLE chatbot_actions RENAME TO agent_actions;

-- Rename enum chatbotStatus to agentStatus
ALTER TYPE "chatbotStatus" RENAME TO "agentStatus";

-- Rename agentStatus column in agents table
ALTER TABLE agents RENAME COLUMN "chatbotStatus" TO "agentStatus";

-- Rename chatbotId column in agent_actions
ALTER TABLE agent_actions RENAME COLUMN "chatbotId" TO "agentId";

-- Rename chatbotId column in dependent tables
ALTER TABLE behavior RENAME COLUMN "chatbotId" TO "agentId";
ALTER TABLE channels RENAME COLUMN "chatbotId" TO "agentId";
ALTER TABLE conversations RENAME COLUMN "chatbotId" TO "agentId";
ALTER TABLE documents RENAME COLUMN "chatbotId" TO "agentId";
ALTER TABLE leads RENAME COLUMN "chatbotId" TO "agentId";
ALTER TABLE ai_cost_events RENAME COLUMN "chatbotId" TO "agentId";

-- Rename indexes on agents
ALTER INDEX chatbots_org_idx RENAME TO agents_org_idx;

-- Rename indexes on agent_actions
ALTER INDEX chatbot_actions_chatbot_idx RENAME TO agent_actions_agent_idx;
ALTER INDEX chatbot_actions_chatbot_type_unique RENAME TO agent_actions_agent_type_unique;

-- Rename indexes on dependent tables
ALTER INDEX behavior_chatbot_unique RENAME TO behavior_agent_unique;
ALTER INDEX channels_chatbot_idx RENAME TO channels_agent_idx;
ALTER INDEX conversations_chatbot_idx RENAME TO conversations_agent_idx;
ALTER INDEX conversations_chatbot_lastmsg_idx RENAME TO conversations_agent_lastmsg_idx;
ALTER INDEX documents_chatbot_idx RENAME TO documents_agent_idx;
ALTER INDEX documents_chatbot_status_idx RENAME TO documents_agent_status_idx;
ALTER INDEX leads_chatbot_idx RENAME TO leads_agent_idx;
