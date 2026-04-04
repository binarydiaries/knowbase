import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { orgUsageDaily } from '../../db/schema/orgUsageDaily';
import { orgUsageMonthly } from '../../db/schema/orgUsageMonthly';

function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getUtcMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export abstract class OrgUsageDailyService {
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

  static async tryConsumeTrainingRun(orgId: string, limit: number) {
    const dateKey = getUtcDateKey();

    return db.transaction(async (tx) => {
      await tx
        .insert(orgUsageDaily)
        .values({
          orgId,
          dateKey,
          trainingRuns: 0,
        })
        .onConflictDoNothing();

      const lockedRow = await tx.execute<{ trainingRuns: number }>(
        sql`select "trainingRuns" from "org_usage_daily" where "orgId" = ${orgId} and "dateKey" = ${dateKey} for update`,
      );

      const currentRuns = lockedRow.rows[0]?.trainingRuns ?? 0;
      if (currentRuns >= limit) {
        return {
          allowed: false as const,
          trainingRunsToday: currentRuns,
        };
      }

      const [updatedUsage] = await tx
        .update(orgUsageDaily)
        .set({
          trainingRuns: sql`${orgUsageDaily.trainingRuns} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orgUsageDaily.orgId, orgId),
            eq(orgUsageDaily.dateKey, dateKey),
          ),
        )
        .returning({
          trainingRuns: orgUsageDaily.trainingRuns,
        });

      return {
        allowed: true as const,
        trainingRunsToday: updatedUsage.trainingRuns,
      };
    });
  }
}

export abstract class OrgUsageMonthlyService {
  static async getCurrentMonthAssistantMessages(orgId: string) {
    const monthKey = getUtcMonthKey();
    const usage = await db.query.orgUsageMonthly.findFirst({
      where: {
        orgId,
        monthKey,
      },
    });

    return usage?.assistantMessages ?? 0;
  }

  static async incrementAssistantMessages(orgId: string) {
    const monthKey = getUtcMonthKey();

    return db.transaction(async (tx) => {
      await tx
        .insert(orgUsageMonthly)
        .values({
          orgId,
          monthKey,
          assistantMessages: 0,
        })
        .onConflictDoNothing();

      const [updatedUsage] = await tx
        .update(orgUsageMonthly)
        .set({
          assistantMessages: sql`${orgUsageMonthly.assistantMessages} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orgUsageMonthly.orgId, orgId),
            eq(orgUsageMonthly.monthKey, monthKey),
          ),
        )
        .returning({
          assistantMessages: orgUsageMonthly.assistantMessages,
        });

      return updatedUsage.assistantMessages;
    });
  }
}
