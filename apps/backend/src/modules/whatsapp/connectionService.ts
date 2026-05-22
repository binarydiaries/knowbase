import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { whatsappConnections } from '../../db/schema/whatsappConnections';
import { decryptToken, encryptToken } from '../../utils/crypto.utils';

function encryptRow(data: { accessToken: string; businessAccountId: string }) {
  return { ...data, accessToken: encryptToken(data.accessToken) };
}

function decryptRow<T extends { accessToken: string }>(row: T): T {
  return { ...row, accessToken: decryptToken(row.accessToken) };
}

export abstract class WhatsAppConnectionService {
  static async findByOrg(orgId: string) {
    const row = await db.query.whatsappConnections.findFirst({
      where: { orgId },
    });
    return row ? decryptRow(row) : row;
  }

  static async upsert(
    orgId: string,
    data: { accessToken: string; businessAccountId: string },
  ) {
    const encrypted = encryptRow(data);
    const existing = await db.query.whatsappConnections.findFirst({
      where: { orgId },
    });
    if (existing) {
      const [row] = await db
        .update(whatsappConnections)
        .set(encrypted)
        .where(eq(whatsappConnections.orgId, orgId))
        .returning();
      return decryptRow(row);
    }
    const [row] = await db
      .insert(whatsappConnections)
      .values({ orgId, ...encrypted })
      .returning();
    return decryptRow(row);
  }

  static async delete(orgId: string) {
    await db
      .delete(whatsappConnections)
      .where(eq(whatsappConnections.orgId, orgId));
  }
}
