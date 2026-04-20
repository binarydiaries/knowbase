import { desc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { leads } from '../../db/schema/leads';

export abstract class LeadService {
  static async create(data: typeof leads.$inferInsert) {
    const rows = await db.insert(leads).values(data).returning();
    return rows[0];
  }

  static list({
    orgId,
    chatbotId,
    limit = 20,
    offset = 0,
  }: {
    orgId: string;
    chatbotId?: string;
    limit?: number;
    offset?: number;
  }) {
    return db.query.leads.findMany({
      where: chatbotId ? { orgId, chatbotId } : { orgId },
      with: {
        chatbot: { columns: { id: true, name: true } },
        channel: { columns: { id: true, type: true } },
        conversation: { columns: { id: true } },
      },
      orderBy: (t) => desc(t.createdAt),
      limit,
      offset,
    });
  }

  static async count({ orgId, chatbotId }: { orgId: string; chatbotId?: string }) {
    const rows = await db.query.leads.findMany({
      where: chatbotId ? { orgId, chatbotId } : { orgId },
      columns: { id: true },
    });
    return rows.length;
  }
}
