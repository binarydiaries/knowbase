import { defineRelations } from 'drizzle-orm';
import { behaviors } from './behaviors';
import { channels } from './channels';
import { chatbots } from './chatbots';
import { conversations } from './conversations';
import { documents } from './documents';

export const relations = defineRelations(
  { chatbots, channels, behaviors, documents, conversations },
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
    conversations: {},
  }),
);
