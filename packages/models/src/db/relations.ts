import { defineRelations } from 'drizzle-orm';
import { agentActions } from './schema/agentActions.js';
import { agents } from './schema/agents.js';
import { aiCostEvents } from './schema/aiCostEvents.js';
import { behaviors } from './schema/behaviors.js';
import { channels } from './schema/channels.js';
import { conversations } from './schema/conversations.js';
import { demoBookings } from './schema/demoBookings.js';
import { documents } from './schema/documents.js';
import { embeddings } from './schema/embeddings.js';
import { featureFlagDefinitions } from './schema/featureFlagDefinitions.js';
import { leads } from './schema/leads.js';
import { messages } from './schema/messages.js';
import { orgFeatureFlags } from './schema/orgFeatureFlags.js';
import { orgSubscriptions } from './schema/orgSubscriptions.js';
import { orgUsageDaily } from './schema/orgUsageDaily.js';
import { orgUsageMonthly } from './schema/orgUsageMonthly.js';
import { slackConnections } from './schema/slackConnections.js';
import { whatsappConnections } from './schema/whatsappConnections.js';
import { workflowActions } from './schema/workflowActions.js';
import { workflows } from './schema/workflows.js';

export const relations = defineRelations(
  {
    aiCostEvents,
    agents,
    demoBookings,
    channels,
    behaviors,
    agentActions,
    documents,
    conversations,
    messages,
    embeddings,
    leads,
    orgUsageDaily,
    orgUsageMonthly,
    orgSubscriptions,
    whatsappConnections,
    slackConnections,
    featureFlagDefinitions,
    orgFeatureFlags,
    workflows,
    workflowActions,
  },
  (r) => ({
    agents: {
      channels: r.many.channels({ from: r.agents.id, to: r.channels.agentId }),
      behaviour: r.one.behaviors({ from: r.agents.id, to: r.behaviors.agentId }),
      documents: r.many.documents({ from: r.agents.id, to: r.documents.agentId }),
      agentActions: r.many.agentActions({ from: r.agents.id, to: r.agentActions.agentId }),
      leads: r.many.leads({ from: r.agents.id, to: r.leads.agentId }),
      workflows: r.many.workflows({ from: r.agents.id, to: r.workflows.agentId }),
    },
    documents: {
      agent: r.one.agents({ from: r.documents.agentId, to: r.agents.id }),
    },
    behaviors: {
      agent: r.one.agents({ from: r.behaviors.agentId, to: r.agents.id }),
    },
    channels: {
      agent: r.one.agents({ from: r.channels.agentId, to: r.agents.id }),
    },
    conversations: {
      agent: r.one.agents({ from: r.conversations.agentId, to: r.agents.id }),
      channel: r.one.channels({ from: r.conversations.channelId, to: r.channels.id }),
    },
    messages: {
      conversation: r.one.conversations({ from: r.messages.conversationId, to: r.conversations.id }),
    },
    embeddings: {
      document: r.one.documents({ from: r.embeddings.documentId, to: r.documents.id }),
    },
    agentActions: {
      agent: r.one.agents({ from: r.agentActions.agentId, to: r.agents.id }),
    },
    leads: {
      agent: r.one.agents({ from: r.leads.agentId, to: r.agents.id }),
      conversation: r.one.conversations({ from: r.leads.conversationId, to: r.conversations.id }),
      channel: r.one.channels({ from: r.leads.channelId, to: r.channels.id }),
    },
    workflows: {
      agent: r.one.agents({ from: r.workflows.agentId, to: r.agents.id }),
      actions: r.many.workflowActions({ from: r.workflows.id, to: r.workflowActions.workflowId }),
    },
    workflowActions: {
      workflow: r.one.workflows({ from: r.workflowActions.workflowId, to: r.workflows.id }),
    },
    orgUsageDaily: {},
    orgUsageMonthly: {},
    orgSubscriptions: {},
    aiCostEvents: {},
    whatsappConnections: {},
    slackConnections: {},
    featureFlagDefinitions: {},
    orgFeatureFlags: {},
    demoBookings: {},
  }),
);
