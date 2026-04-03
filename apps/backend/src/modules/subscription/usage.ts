import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { orgUsageDaily } from '../../db/schema/orgUsageDaily';

function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export abstract class OrgUsageDailyService {
  static getUtcDateKey = getUtcDateKey;

  static async getTodayTrainingRuns(orgId: string) {
    const dateKey = getUtcDateKey();
    const usage = await db.query.orgUsageDaily.findFirst({
      where: {
        orgId,
        dateKey,
      },
    });

    return usage?.trainingRuns ?? 0;
  }

  static async incrementTodayTrainingRuns(orgId: string) {
    const dateKey = getUtcDateKey();

    const [usage] = await db
      .insert(orgUsageDaily)
      .values({
        orgId,
        dateKey,
        trainingRuns: 1,
      })
      .onConflictDoUpdate({
        target: [orgUsageDaily.orgId, orgUsageDaily.dateKey],
        set: {
          trainingRuns: sql`${orgUsageDaily.trainingRuns} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return usage.trainingRuns;
  }
}
