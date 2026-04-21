import { and, desc, gte, lt, sql, sum } from 'drizzle-orm';
import { db } from '../../db';
import { aiCostEvents } from '../../db/schema/aiCostEvents';

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function monthStartDate(monthKey: string) {
  return new Date(`${monthKey}-01T00:00:00.000Z`);
}

function monthEndDate(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
}

function parseNumeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(6));
}

export abstract class AdminCostsService {
  static async getCostByOrganization({
    startMonth,
    endMonth,
  }: {
    startMonth?: string;
    endMonth?: string;
  }) {
    const start = startMonth ?? currentMonthKey();
    const end = endMonth ?? currentMonthKey();
    const startDate = monthStartDate(start);
    const endDateExclusive = monthEndDate(end);

    const rows = await db
      .select({
        orgId: aiCostEvents.orgId,
        requestCount: sql<number>`count(*)`,
        inputTokens: sum(aiCostEvents.inputTokens),
        outputTokens: sum(aiCostEvents.outputTokens),
        cachedInputTokens: sum(aiCostEvents.cachedInputTokens),
        totalTokens: sum(aiCostEvents.totalTokens),
        costUsd: sum(aiCostEvents.costUsd),
      })
      .from(aiCostEvents)
      .where(
        and(
          gte(aiCostEvents.occurredAt, startDate),
          lt(aiCostEvents.occurredAt, endDateExclusive),
        ),
      )
      .groupBy(aiCostEvents.orgId)
      .orderBy(desc(sql`sum(${aiCostEvents.costUsd})`));

    const data = rows.map((row) => ({
      orgId: row.orgId,
      requestCount: parseNumeric(row.requestCount),
      inputTokens: parseNumeric(row.inputTokens),
      outputTokens: parseNumeric(row.outputTokens),
      cachedInputTokens: parseNumeric(row.cachedInputTokens),
      totalTokens: parseNumeric(row.totalTokens),
      costUsd: roundCurrency(parseNumeric(row.costUsd)),
    }));

    const totals = data.reduce(
      (acc, row) => ({
        requestCount: acc.requestCount + row.requestCount,
        inputTokens: acc.inputTokens + row.inputTokens,
        outputTokens: acc.outputTokens + row.outputTokens,
        cachedInputTokens: acc.cachedInputTokens + row.cachedInputTokens,
        totalTokens: acc.totalTokens + row.totalTokens,
        costUsd: acc.costUsd + row.costUsd,
      }),
      {
        requestCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        totalTokens: 0,
        costUsd: 0,
      },
    );

    return {
      data,
      meta: {
        startMonth: start,
        endMonth: end,
        totalRequestCount: totals.requestCount,
        totalInputTokens: totals.inputTokens,
        totalOutputTokens: totals.outputTokens,
        totalCachedInputTokens: totals.cachedInputTokens,
        totalTokens: totals.totalTokens,
        totalCostUsd: roundCurrency(totals.costUsd),
      },
    };
  }
}
