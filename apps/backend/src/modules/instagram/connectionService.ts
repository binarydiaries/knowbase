import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { instagramConnections } from '../../db/schema/instagramConnections';

export abstract class InstagramConnectionService {
  static findByOrg(orgId: string) {
    return db.query.instagramConnections.findFirst({ where: { orgId } });
  }

  static async upsert(
    orgId: string,
    data: { pageAccessToken: string; pageId: string; instagramAccountId: string },
  ) {
    const existing = await InstagramConnectionService.findByOrg(orgId);
    if (existing) {
      const [row] = await db
        .update(instagramConnections)
        .set(data)
        .where(eq(instagramConnections.orgId, orgId))
        .returning();
      return row;
    }
    const [row] = await db
      .insert(instagramConnections)
      .values({ orgId, ...data })
      .returning();
    return row;
  }

  static async delete(orgId: string) {
    await db
      .delete(instagramConnections)
      .where(eq(instagramConnections.orgId, orgId));
  }
}
