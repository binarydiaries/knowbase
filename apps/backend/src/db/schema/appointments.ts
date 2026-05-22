import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { cuid2PrimaryKey, timestamps } from '../../utils/columns.utils';
import { agents } from './agents';
import { channels } from './channels';
import { conversations } from './conversations';

export const appointments = pgTable(
  'appointments',
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
    calBookingUid: text().notNull(),
    attendeeName: text().notNull(),
    attendeeEmail: text().notNull(),
    startTime: timestamp({ withTimezone: true }).notNull(),
    notes: text(),
    ...timestamps,
  },
  (t) => [
    index('appointments_agent_idx').on(t.agentId),
    index('appointments_org_idx').on(t.orgId),
    index('appointments_channel_idx').on(t.channelId),
  ],
);
