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
    agentId,
    limit = 20,
    offset = 0,
  }: {
    orgId: string;
    agentId?: string;
    limit?: number;
    offset?: number;
  }) {
    return db.query.leads.findMany({
      where: agentId ? { orgId, agentId } : { orgId },
      with: {
        agent: { columns: { id: true, name: true } },
        channel: { columns: { id: true, type: true } },
        conversation: { columns: { id: true } },
      },
      orderBy: (t) => desc(t.createdAt),
      limit,
      offset,
    });
  }

  static async count({ orgId, agentId }: { orgId: string; agentId?: string }) {
    const rows = await db.query.leads.findMany({
      where: agentId ? { orgId, agentId } : { orgId },
      columns: { id: true },
    });
    return rows.length;
  }
}
