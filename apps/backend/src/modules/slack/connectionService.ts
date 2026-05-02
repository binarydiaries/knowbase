import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { slackConnections } from '../../db/schema/slackConnections';

export abstract class SlackConnectionService {
  static findByOrg(orgId: string) {
    return db.query.slackConnections.findFirst({ where: { orgId } });
  }

  static findByTeamId(teamId: string) {
    return db.query.slackConnections.findFirst({ where: { teamId } });
  }

  static async upsert(
    orgId: string,
    data: { botToken: string; teamId: string; teamName: string; botUserId: string },
  ) {
    const existing = await SlackConnectionService.findByOrg(orgId);
    if (existing) {
      const [row] = await db
        .update(slackConnections)
        .set(data)
        .where(eq(slackConnections.orgId, orgId))
        .returning();
      return row;
    }
    const [row] = await db
      .insert(slackConnections)
      .values({ orgId, ...data })
      .returning();
    return row;
  }

  static async delete(orgId: string) {
    await db.delete(slackConnections).where(eq(slackConnections.orgId, orgId));
  }
}
