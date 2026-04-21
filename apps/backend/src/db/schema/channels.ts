import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
} from 'drizzle-orm/pg-core';
import {
  clerkUserId,
  cuid2PrimaryKey,
  timestamps,
} from '../../utils/columns.utils';
import { agents } from './agents';

export const channelType = pgEnum('type', ['web', 'whatsapp', 'instagram']);
export const channelStatus = pgEnum('channelStatus', [
  'inactive',
  'active',
  'error',
]);

export const channels = pgTable(
  'channels',
  {
    id: cuid2PrimaryKey,
    agentId: text()
      .notNull()
      .references(() => agents.id),
    type: channelType().notNull(),
    enabled: boolean().notNull().default(false),
    config: jsonb().$type<object>().notNull(),
    channelStatus: channelStatus().notNull().default('inactive'),
    usage: jsonb().$type<object>().notNull(),
    createdBy: clerkUserId,
    ...timestamps,
  },
  (table) => [
    // 🔥 Fast lookup by agent
    index('channels_agent_idx').on(table.agentId),
  ],
);
