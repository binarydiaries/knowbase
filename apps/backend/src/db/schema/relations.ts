import { defineRelations } from 'drizzle-orm';
import { aiCostEvents } from './aiCostEvents';
import { behaviors } from './behaviors';
import { channels } from './channels';
import { agentActions } from './agentActions';
import { agents } from './agents';
import { conversations } from './conversations';
import { documents } from './documents';
import { embeddings } from './embeddings';
import { leads } from './leads';
import { messages } from './messages';
import { orgUsageDaily } from './orgUsageDaily';
import { orgUsageMonthly } from './orgUsageMonthly';
import { orgSubscriptions } from './orgSubscriptions';
import { whatsappConnections } from './whatsappConnections';
import { slackConnections } from './slackConnections';

export const relations = defineRelations(
  {
    aiCostEvents,
    agents,
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
      agentActions: r.many.agentActions({
        from: r.agents.id,
        to: r.agentActions.agentId,
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
    agentActions: {
      agent: r.one.agents({
        from: r.agentActions.agentId,
        to: r.agents.id,
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
  }),
);
