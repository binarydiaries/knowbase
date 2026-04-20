import { boolean, index, jsonb, pgEnum, pgTable, text, unique, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { chatbots } from './chatbots';

export const actionType = pgEnum('actionType', ['lead_generation']);

export const chatbotActions = pgTable(
  'chatbot_actions',
  {
    id: cuid2PrimaryKey,
    chatbotId: text()
      .notNull()
      .references(() => chatbots.id, { onDelete: 'cascade' }),
    actionType: actionType().notNull(),
    enabled: boolean().notNull().default(true),
    config: jsonb().$type<LeadGenerationConfig>().notNull().default({}),
    createdBy: varchar({ length: 64 }).notNull(),
    ...timestamps,
  },
  (t) => [
    index('chatbot_actions_chatbot_idx').on(t.chatbotId),
    unique('chatbot_actions_chatbot_type_unique').on(t.chatbotId, t.actionType),
  ],
);

export type LeadFieldConfig = {
  collect: boolean;
  required: boolean;
};

export type LeadGenerationConfig = {
  fields?: {
    name?: LeadFieldConfig;
    email?: LeadFieldConfig;
    phone?: LeadFieldConfig;
    company?: LeadFieldConfig;
  };
  triggerInstructions?: string;
  successMessage?: string;
};
