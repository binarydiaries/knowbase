import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { featureFlagDefinitions } from '../../db/schema/featureFlagDefinitions';
import { orgFeatureFlags } from '../../db/schema/orgFeatureFlags';
import { createId } from '@paralleldrive/cuid2';

export abstract class FeatureFlagService {
  static async isEnabled(flag: string, orgId: string): Promise<boolean> {
    const orgOverride = await db.query.orgFeatureFlags.findFirst({
      where: { flag, orgId },
    });
    if (orgOverride !== undefined) return orgOverride.enabled;

    const definition = await db.query.featureFlagDefinitions.findFirst({
      where: { flag },
    });
    return definition?.globalEnabled ?? false;
  }

  static async listAll() {
    const definitions = await db.query.featureFlagDefinitions.findMany({
      orderBy: (t, { asc }) => [asc(t.flag)],
    });

    const overrides = await db.query.orgFeatureFlags.findMany();

    const overrideCountByFlag = overrides.reduce<Record<string, number>>((acc, o) => {
      acc[o.flag] = (acc[o.flag] ?? 0) + 1;
      return acc;
    }, {});

    return definitions.map((d) => ({
      flag: d.flag,
      description: d.description,
      globalEnabled: d.globalEnabled,
      orgOverrideCount: overrideCountByFlag[d.flag] ?? 0,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }

  static async setGlobal(flag: string, enabled: boolean, description?: string) {
    const existing = await db.query.featureFlagDefinitions.findFirst({
      where: { flag },
    });

    if (existing) {
      await db
        .update(featureFlagDefinitions)
        .set({
          globalEnabled: enabled,
          ...(description !== undefined && { description }),
          updatedAt: new Date(),
        })
        .where(eq(featureFlagDefinitions.flag, flag));
    } else {
      await db.insert(featureFlagDefinitions).values({
        id: createId(),
        flag,
        description: description ?? null,
        globalEnabled: enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  static async listOrgOverrides(flag: string) {
    const overrides = await db.query.orgFeatureFlags.findMany({
      where: { flag },
      orderBy: (t, { asc }) => [asc(t.orgId)],
    });
    return overrides.map((o) => ({
      orgId: o.orgId,
      flag: o.flag,
      enabled: o.enabled,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));
  }

  static async setOrgOverrides(flag: string, orgIds: string[], enabled: boolean) {
    for (const orgId of orgIds) {
      const existing = await db.query.orgFeatureFlags.findFirst({
        where: { flag, orgId },
      });
      if (existing) {
        await db
          .update(orgFeatureFlags)
          .set({ enabled, updatedAt: new Date() })
          .where(and(eq(orgFeatureFlags.flag, flag), eq(orgFeatureFlags.orgId, orgId)));
      } else {
        await db.insert(orgFeatureFlags).values({
          id: createId(),
          flag,
          orgId,
          enabled,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  static async removeOrgOverride(flag: string, orgId: string) {
    await db
      .delete(orgFeatureFlags)
      .where(and(eq(orgFeatureFlags.flag, flag), eq(orgFeatureFlags.orgId, orgId)));
  }

  static async getForOrg(orgId: string): Promise<Record<string, boolean>> {
    const definitions = await db.query.featureFlagDefinitions.findMany();
    const overrides = await db.query.orgFeatureFlags.findMany({
      where: { orgId },
    });

    const overrideMap = new Map(overrides.map((o) => [o.flag, o.enabled]));

    const result: Record<string, boolean> = {};
    for (const def of definitions) {
      result[def.flag] = overrideMap.has(def.flag)
        ? overrideMap.get(def.flag)!
        : def.globalEnabled;
    }
    return result;
  }
}
