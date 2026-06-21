import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orgSubscriptions } from '../../db/schema/orgSubscriptions';
import { AdminGuard } from '../../common/authGuard/adminGuard';
import { getDefaultProvider, getProvider } from '../subscription/providers';
import { eq } from 'drizzle-orm';

type OrgSub = typeof orgSubscriptions.$inferSelect;

type SafeStatus = 'healthy' | 'expiring' | 'risky' | 'expired' | 'pending' | 'free';

function computeSafeStatus(record: OrgSub): SafeStatus {
  if (!record.providerSubscriptionId || record.plan === 'free') return 'free';
  const now = new Date();
  switch (record.status) {
    case 'active':
    case 'authenticated':
      return record.currentPeriodEnd && record.currentPeriodEnd < now ? 'risky' : 'healthy';
    case 'halted':
      return 'risky';
    case 'pending_cancellation':
      return 'expiring';
    case 'created':
      return 'pending';
    case 'cancelled':
    case 'completed':
      return 'expired';
    default:
      return 'risky';
  }
}

function toRow(record: OrgSub) {
  return {
    orgId: record.orgId,
    plan: record.plan,
    status: record.status,
    safeStatus: computeSafeStatus(record),
    provider: record.provider,
    providerSubscriptionId: record.providerSubscriptionId ?? null,
    currentPeriodStart: record.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: record.currentPeriodEnd?.toISOString() ?? null,
    lastPaymentId: record.lastPaymentId ?? null,
    updatedAt: record.updatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

async function syncOrgFromGateway(orgId: string) {
  const provider = getDefaultProvider();

  if (provider.getSubscription) {
    // Kelviq: fetch live state directly — no subscriptionId needed
    const live = await provider.getSubscription(orgId);
    if (!live) throw new Error(`No subscription found for org ${orgId}`);

    const TERMINAL = new Set(['cancelled', 'canceled', 'expired', 'completed']);
    const plan = TERMINAL.has(live.status) ? 'free' : live.plan;

    await db
      .insert(orgSubscriptions)
      .values({
        orgId,
        plan,
        status: live.status,
        provider: provider.name,
        providerSubscriptionId: live.subscriptionId,
        currentPeriodStart: live.currentPeriodStart,
        currentPeriodEnd: live.currentPeriodEnd,
      })
      .onConflictDoUpdate({
        target: orgSubscriptions.orgId,
        set: {
          plan,
          status: live.status,
          provider: provider.name,
          providerSubscriptionId: live.subscriptionId,
          currentPeriodStart: live.currentPeriodStart,
          currentPeriodEnd: live.currentPeriodEnd,
          updatedAt: new Date(),
        },
      });
  } else {
    // Razorpay: needs providerSubscriptionId from local DB
    const record = await db.query.orgSubscriptions.findFirst({ where: { orgId } });
    if (!record?.providerSubscriptionId) {
      throw new Error(`No provider subscription for org ${orgId}`);
    }

    const razorpay = getProvider(record.provider ?? 'razorpay');
    const live = await razorpay.fetchSubscription(record.providerSubscriptionId, orgId);
    const TERMINAL = new Set(['cancelled', 'completed', 'expired']);
    const plan = TERMINAL.has(live.status) ? 'free' : record.plan;

    await db
      .update(orgSubscriptions)
      .set({
        status: live.status,
        plan,
        currentPeriodStart: live.currentPeriodStart ?? record.currentPeriodStart,
        currentPeriodEnd: live.currentPeriodEnd ?? record.currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(orgSubscriptions.orgId, orgId));
  }

  const updated = await db.query.orgSubscriptions.findFirst({ where: { orgId } });
  return toRow(updated!);
}

export const AdminSubscriptions = new Elysia({
  prefix: '/admin/subscriptions',
  tags: ['Admin'],
})
  .use(AdminGuard)
  .get(
    '/',
    async ({ query }) => {
      const page = Math.max(1, query.page ?? 1);
      const limit = Math.min(100, Math.max(1, query.limit ?? 25));
      const offset = (page - 1) * limit;

      const all = await db.query.orgSubscriptions.findMany({
        orderBy: (t, { desc }) => [desc(t.updatedAt)],
      });

      const statusFilter = query.status;
      const filtered = statusFilter && statusFilter !== 'all'
        ? all.filter((r) => computeSafeStatus(r) === statusFilter)
        : all;

      const total = filtered.length;
      const rows = filtered.slice(offset, offset + limit).map(toRow);

      const counts: Record<SafeStatus | 'all', number> = {
        all: all.length,
        healthy: 0,
        expiring: 0,
        risky: 0,
        expired: 0,
        pending: 0,
        free: 0,
      };
      for (const r of all) counts[computeSafeStatus(r)]++;

      return { rows, total, page, limit, counts };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
        status: t.Optional(t.String()),
      }),
    },
  )
  .post(
    '/:orgId/sync',
    async ({ params, set }) => {
      try {
        const row = await syncOrgFromGateway(params.orgId);
        return { success: true, row };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message ?? 'Sync failed' };
      }
    },
  )
  .post(
    '/bulk-sync',
    async ({ body }) => {
      let targets: string[];

      if (body?.orgIds?.length) {
        targets = body.orgIds.slice(0, 200);
      } else {
        const all = await db.query.orgSubscriptions.findMany();
        targets = all
          .filter((r) => r.providerSubscriptionId)
          .map((r) => r.orgId);
      }

      let synced = 0;
      let errors = 0;

      for (const orgId of targets) {
        try {
          await syncOrgFromGateway(orgId);
          synced++;
        } catch {
          errors++;
        }
      }

      return { synced, errors, total: targets.length };
    },
    {
      body: t.Optional(
        t.Object({
          orgIds: t.Optional(t.Array(t.String())),
        }),
      ),
    },
  );
