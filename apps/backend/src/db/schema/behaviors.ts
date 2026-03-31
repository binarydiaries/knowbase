import { pgEnum, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import {
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { chatbots } from './chatbots';

export const behaviorTone = pgEnum('tone', [
  'friendly',
  'professional',
  'neutral',
]);

export const behaviorVerbosity = pgEnum('verbosity', [
  'short',
  'balanced',
  'detailed',
]);

export const behaviors = pgTable(
  'behavior',
  {
    id: cuid2PrimaryKey,
    chatbotId: text()
      .notNull()
      .references(() => chatbots.id),
    systemPrompt: text().notNull(),
    tone: behaviorTone().notNull().default('neutral'),
    verbosity: behaviorVerbosity().notNull().default('balanced'),
    fallbackMessage: text().notNull(),
    guardrails: text(),
    createdBy: clerkUserId,
    ...timestamps,
  },
  (table) => [
    // 🔥 Enforce 1–1 relationship
    uniqueIndex('behavior_chatbot_unique').on(table.chatbotId),
  ],
);
