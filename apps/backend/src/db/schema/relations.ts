import { defineRelations } from 'drizzle-orm';
import { behaviors } from './behaviors';
import { channels } from './channels';
import { chatbots } from './chatbots';
import { documents } from './documents';

export const relations = defineRelations(
  { chatbots, channels, behaviors, documents },
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
  }),
);
