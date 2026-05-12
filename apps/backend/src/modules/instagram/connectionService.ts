import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { instagramConnections } from '../../db/schema/instagramConnections';
import { decryptToken, encryptToken } from '../../utils/crypto.utils';

function encryptRow(data: { pageAccessToken: string; instagramAccountId: string; username?: string | null }) {
  return { ...data, pageAccessToken: encryptToken(data.pageAccessToken) };
}

function decryptRow<T extends { pageAccessToken: string }>(row: T): T {
  return { ...row, pageAccessToken: decryptToken(row.pageAccessToken) };
}

export abstract class InstagramConnectionService {
  static async findByOrg(orgId: string) {
    const row = await db.query.instagramConnections.findFirst({ where: { orgId } });
    return row ? decryptRow(row) : row;
  }

  static async upsert(
    orgId: string,
    data: { pageAccessToken: string; instagramAccountId: string; username?: string | null },
  ) {
    const encrypted = encryptRow(data);
    const existing = await db.query.instagramConnections.findFirst({ where: { orgId } });
    if (existing) {
      const [row] = await db
        .update(instagramConnections)
        .set(encrypted)
        .where(eq(instagramConnections.orgId, orgId))
        .returning();
      return decryptRow(row);
    }
    const [row] = await db
      .insert(instagramConnections)
      .values({ orgId, ...encrypted })
      .returning();
    return decryptRow(row);
  }

  static async delete(orgId: string) {
    await db
      .delete(instagramConnections)
      .where(eq(instagramConnections.orgId, orgId));
  }
}
