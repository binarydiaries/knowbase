import { Elysia, t } from 'elysia';
import { AdminGuard } from '../../common/authGuard/adminGuard';
import { FeatureFlagService } from '../featureFlag/service';

export const AdminFeatureFlags = new Elysia({
  prefix: '/admin/feature-flags',
  tags: ['Admin'],
})
  .use(AdminGuard)
  .get('/', async () => {
    return FeatureFlagService.listAll();
  })
  .put(
    '/:flag',
    async ({ params, body }) => {
      await FeatureFlagService.setGlobal(params.flag, body.globalEnabled, body.description);
      const all = await FeatureFlagService.listAll();
      const updated = all.find((f) => f.flag === params.flag);
      return updated ?? { flag: params.flag, globalEnabled: body.globalEnabled };
    },
    {
      params: t.Object({ flag: t.String() }),
      body: t.Object({
        globalEnabled: t.Boolean(),
        description: t.Optional(t.String()),
      }),
    },
  )
  .get(
    '/:flag/orgs',
    async ({ params }) => {
      return FeatureFlagService.listOrgOverrides(params.flag);
    },
    {
      params: t.Object({ flag: t.String() }),
    },
  )
  .put(
    '/:flag/orgs',
    async ({ params, body }) => {
      await FeatureFlagService.setOrgOverrides(params.flag, body.orgIds, body.enabled);
      return { success: true, count: body.orgIds.length };
    },
    {
      params: t.Object({ flag: t.String() }),
      body: t.Object({
        orgIds: t.Array(t.String()),
        enabled: t.Boolean(),
      }),
    },
  )
  .delete(
    '/:flag/orgs/:orgId',
    async ({ params }) => {
      await FeatureFlagService.removeOrgOverride(params.flag, params.orgId);
      return { success: true };
    },
    {
      params: t.Object({ flag: t.String(), orgId: t.String() }),
    },
  )
  .delete(
    '/:flag',
    async ({ params }) => {
      await FeatureFlagService.deleteFlag(params.flag);
      return { success: true };
    },
    {
      params: t.Object({ flag: t.String() }),
    },
  );
