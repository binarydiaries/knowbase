import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { whatsappConnections } from '../../db/schema/whatsappConnections';

export abstract class WhatsAppConnectionService {
  static findByOrg(orgId: string) {
    return db.query.whatsappConnections.findFirst({ where: { orgId } });
  }

  static async upsert(
    orgId: string,
    data: { accessToken: string; businessAccountId: string },
  ) {
    const existing = await WhatsAppConnectionService.findByOrg(orgId);
    if (existing) {
      const [row] = await db
        .update(whatsappConnections)
        .set(data)
        .where(eq(whatsappConnections.orgId, orgId))
        .returning();
      return row;
    }
    const [row] = await db
      .insert(whatsappConnections)
      .values({ orgId, ...data })
      .returning();
    return row;
  }

  static async delete(orgId: string) {
    await db
      .delete(whatsappConnections)
      .where(eq(whatsappConnections.orgId, orgId));
  }
}
