import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { calcomConnections } from '../../db/schema/calcomConnections';

export abstract class CalcomConnectionService {
  static findByOrg(orgId: string) {
    return db.query.calcomConnections.findFirst({ where: { orgId } });
  }

  static async upsert(orgId: string, calApiKey: string) {
    const rows = await db
      .insert(calcomConnections)
      .values({ orgId, calApiKey })
      .onConflictDoUpdate({
        target: calcomConnections.orgId,
        set: { calApiKey, updatedAt: new Date() },
      })
      .returning();
    return rows[0];
  }

  static async delete(orgId: string) {
    await db
      .delete(calcomConnections)
      .where(eq(calcomConnections.orgId, orgId));
  }
}
