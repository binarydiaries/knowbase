import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { slackConnections } from '../../db/schema/slackConnections';
import { decryptToken, encryptToken } from '../../utils/crypto.utils';

function encryptRow(data: { botToken: string; teamId: string; teamName: string; botUserId: string }) {
  return { ...data, botToken: encryptToken(data.botToken) };
}

function decryptRow<T extends { botToken: string }>(row: T): T {
  return { ...row, botToken: decryptToken(row.botToken) };
}

export abstract class SlackConnectionService {
  static async findByOrg(orgId: string) {
    const row = await db.query.slackConnections.findFirst({ where: { orgId } });
    return row ? decryptRow(row) : row;
  }

  static async findByTeamId(teamId: string) {
    const row = await db.query.slackConnections.findFirst({ where: { teamId } });
    return row ? decryptRow(row) : row;
  }

  static async upsert(
    orgId: string,
    data: { botToken: string; teamId: string; teamName: string; botUserId: string },
  ) {
    const encrypted = encryptRow(data);
    const existing = await db.query.slackConnections.findFirst({ where: { orgId } });
    if (existing) {
      const [row] = await db
        .update(slackConnections)
        .set(encrypted)
        .where(eq(slackConnections.orgId, orgId))
        .returning();
      return decryptRow(row);
    }
    const [row] = await db
      .insert(slackConnections)
      .values({ orgId, ...encrypted })
      .returning();
    return decryptRow(row);
  }

  static async delete(orgId: string) {
    await db.delete(slackConnections).where(eq(slackConnections.orgId, orgId));
  }
}
