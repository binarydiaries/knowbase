import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { behaviors } from '../../db/schema/behaviors';

export abstract class BehaviourService {
  static single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.behaviors.findFirst({
      where: { id, agent: { orgId } },
    });
  }

  static singleByAgent(agentId: string) {
    return db.query.behaviors.findFirst({
      where: { agentId },
    });
  }

  static list({ orgId }: { orgId: string }) {
    return db.query.behaviors.findMany({
      where: { agent: { orgId } },
    });
  }

  static async update(
    id: string,
    data: Partial<typeof behaviors.$inferInsert>,
  ) {
    const rows = await db
      .update(behaviors)
      .set(data)
      .where(eq(behaviors.id, id))
      .returning();
    return rows[0];
  }
}
