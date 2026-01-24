import { relations } from 'drizzle-orm';
import { jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import type { ChatbotSettings } from '../../modules/chatbot/model';
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

export const behaviors = pgTable('behavior', {
  id: cuid2PrimaryKey,
  chatbotId: text()
    .notNull()
    .references(() => chatbots.id),
  systemPrompt: text().notNull(),
  tone: behaviorTone().notNull(),
  verbosity: behaviorVerbosity().notNull(),
  fallbackMessage: text().notNull(),
  guardrails: text(),
  ...timestamps,
});

export const behaviorRelations = relations(behaviors, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [behaviors.chatbotId],
    references: [chatbots.id],
  }),
}));
