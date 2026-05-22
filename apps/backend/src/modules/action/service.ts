import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { type ActionConfig, agentActions } from '../../db/schema/agentActions';

export abstract class ActionService {
  static getEnabledByAgent(agentId: string) {
    return db.query.agentActions.findMany({
      where: { agentId, enabled: true },
    });
  }

  static getByAgent(agentId: string) {
    return db.query.agentActions.findMany({
      where: { agentId },
    });
  }

  static single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.agentActions.findFirst({
      where: { id, agent: { orgId } },
    });
  }

  static async create(data: typeof agentActions.$inferInsert) {
    const rows = await db.insert(agentActions).values(data).returning();
    return rows[0];
  }

  static async update(
    id: string,
    data: { enabled?: boolean; config?: ActionConfig },
  ) {
    const rows = await db
      .update(agentActions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agentActions.id, id))
      .returning();
    return rows[0];
  }

  static async delete(id: string) {
    const rows = await db
      .delete(agentActions)
      .where(eq(agentActions.id, id))
      .returning();
    return rows[0];
  }
}
