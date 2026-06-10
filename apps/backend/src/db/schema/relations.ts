import { defineRelations } from 'drizzle-orm';
import { agents } from './agents';
import { aiCostEvents } from './aiCostEvents';
import { behaviors } from './behaviors';
import { channels } from './channels';
import { conversations } from './conversations';
import { demoBookings } from './demoBookings';
import { documents } from './documents';
import { embeddings } from './embeddings';
import { featureFlagDefinitions } from './featureFlagDefinitions';
import { leads } from './leads';
import { messages } from './messages';
import { orgFeatureFlags } from './orgFeatureFlags';
import { orgSubscriptions } from './orgSubscriptions';
import { orgUsageDaily } from './orgUsageDaily';
import { orgUsageMonthly } from './orgUsageMonthly';
import { slackConnections } from './slackConnections';
import { whatsappConnections } from './whatsappConnections';
import { workflowActions } from './workflowActions';
import { workflows } from './workflows';

export const relations = defineRelations(
  {
    aiCostEvents,
    agents,
    demoBookings,
    channels,
    behaviors,
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
      channels: r.many.channels({
        from: r.agents.id,
        to: r.channels.agentId,
      }),
      behaviour: r.one.behaviors({
        from: r.agents.id,
        to: r.behaviors.agentId,
      }),
      documents: r.many.documents({
        from: r.agents.id,
        to: r.documents.agentId,
      }),
      leads: r.many.leads({
        from: r.agents.id,
        to: r.leads.agentId,
      }),
    },
    documents: {
      agent: r.one.agents({
        from: r.documents.agentId,
        to: r.agents.id,
      }),
    },
    behaviors: {
      agent: r.one.agents({
        from: r.behaviors.agentId,
        to: r.agents.id,
      }),
    },
    channels: {
      agent: r.one.agents({
        from: r.channels.agentId,
        to: r.agents.id,
      }),
    },
    conversations: {
      agent: r.one.agents({
        from: r.conversations.agentId,
        to: r.agents.id,
      }),
      channel: r.one.channels({
        from: r.conversations.channelId,
        to: r.channels.id,
      }),
    },
    messages: {
      conversation: r.one.conversations({
        from: r.messages.conversationId,
        to: r.conversations.id,
      }),
    },
    embeddings: {
      document: r.one.documents({
        from: r.embeddings.documentId,
        to: r.documents.id,
      }),
    },
    leads: {
      agent: r.one.agents({
        from: r.leads.agentId,
        to: r.agents.id,
      }),
      conversation: r.one.conversations({
        from: r.leads.conversationId,
        to: r.conversations.id,
      }),
      channel: r.one.channels({
        from: r.leads.channelId,
        to: r.channels.id,
      }),
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
    workflows: {
      agent: r.one.agents({ from: r.workflows.agentId, to: r.agents.id }),
      actions: r.many.workflowActions({
        from: r.workflows.id,
        to: r.workflowActions.workflowId,
      }),
    },
    workflowActions: {
      workflow: r.one.workflows({
        from: r.workflowActions.workflowId,
        to: r.workflows.id,
      }),
    },
  }),
);
