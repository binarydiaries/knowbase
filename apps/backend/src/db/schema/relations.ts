import { defineRelations } from 'drizzle-orm';
import { behaviors } from './behaviors';
import { channels } from './channels';
import { chatbots } from './chatbots';
import { conversations } from './conversations';
import { documents } from './documents';
import { embeddings } from './embeddings';
import { messages } from './messages';
import { orgUsageDaily } from './orgUsageDaily';
import { orgUsageMonthly } from './orgUsageMonthly';
import { whatsappConnections } from './whatsappConnections';
import { instagramConnections } from './instagramConnections';

export const relations = defineRelations(
  {
    chatbots,
    channels,
    behaviors,
    documents,
    conversations,
    messages,
    embeddings,
    orgUsageDaily,
    orgUsageMonthly,
    whatsappConnections,
    instagramConnections,
  },
  (r) => ({
    chatbots: {
      channels: r.many.channels({
        from: r.chatbots.id,
        to: r.channels.chatbotId,
      }),
      behaviour: r.one.behaviors({
        from: r.chatbots.id,
        to: r.behaviors.chatbotId,
      }),
      documents: r.many.documents({
        from: r.chatbots.id,
        to: r.documents.chatbotId,
      }),
    },
    documents: {
      chatbot: r.one.chatbots({
        from: r.documents.chatbotId,
        to: r.chatbots.id,
      }),
    },
    behaviors: {
      chatbot: r.one.chatbots({
        from: r.behaviors.chatbotId,
        to: r.chatbots.id,
      }),
    },
    channels: {
      chatbot: r.one.chatbots({
        from: r.channels.chatbotId,
        to: r.chatbots.id,
      }),
    },
    conversations: {
      chatbot: r.one.chatbots({
        from: r.conversations.chatbotId,
        to: r.chatbots.id,
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
    orgUsageDaily: {},
    orgUsageMonthly: {},
    whatsappConnections: {},
    instagramConnections: {},
  }),
);
