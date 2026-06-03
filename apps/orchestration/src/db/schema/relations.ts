import { defineRelations } from 'drizzle-orm';
import { agents } from './agents.js';
import { behaviors } from './behaviors.js';
import { channels } from './channels.js';
import { conversations } from './conversations.js';
import { documents } from './documents.js';
import { embeddings } from './embeddings.js';
import { leads } from './leads.js';
import { messages } from './messages.js';
import { orgSubscriptions } from './orgSubscriptions.js';
import { orgUsageMonthly } from './orgUsageMonthly.js';
import { workflows } from './workflows.js';
import { workflowActions } from './workflowActions.js';

export const relations = defineRelations(
  {
    agents,
    behaviors,
    channels,
    conversations,
    documents,
    embeddings,
    leads,
    messages,
    orgSubscriptions,
    orgUsageMonthly,
    workflows,
    workflowActions,
  },
  (r) => ({
    agents: {
      behaviour: r.one.behaviors({
        from: r.agents.id,
        to: r.behaviors.agentId,
      }),
      channels: r.many.channels({
        from: r.agents.id,
        to: r.channels.agentId,
      }),
      documents: r.many.documents({
        from: r.agents.id,
        to: r.documents.agentId,
      }),
      leads: r.many.leads({
        from: r.agents.id,
        to: r.leads.agentId,
      }),
      workflows: r.many.workflows({
        from: r.agents.id,
        to: r.workflows.agentId,
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
    documents: {
      agent: r.one.agents({
        from: r.documents.agentId,
        to: r.agents.id,
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
    workflows: {
      agent: r.one.agents({
        from: r.workflows.agentId,
        to: r.agents.id,
      }),
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
    orgSubscriptions: {},
    orgUsageMonthly: {},
  }),
);
