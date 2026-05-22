import { index, jsonb, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { agents } from './agents';
import { channels } from './channels';
import { conversations } from './conversations';

export const leads = pgTable(
  'leads',
  {
    id: cuid2PrimaryKey,
    agentId: text()
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    conversationId: text().references(() => conversations.id, {
      onDelete: 'set null',
    }),
    channelId: text().references(() => channels.id, { onDelete: 'set null' }),
    orgId: varchar({ length: 64 }).notNull(),
    name: text(),
    email: text(),
    phone: text(),
    company: text(),
    customFields: jsonb().$type<Record<string, string>>().notNull().default({}),
    ...timestamps,
  },
  (t) => [
    index('leads_agent_idx').on(t.agentId),
    index('leads_org_idx').on(t.orgId),
    index('leads_channel_idx').on(t.channelId),
  ],
);
