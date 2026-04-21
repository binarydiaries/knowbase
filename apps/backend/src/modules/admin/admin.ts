import { Elysia } from 'elysia';
import { AdminGuard } from '../../common/authGuard/adminGuard';
import { AdminCostsModel } from './model';
import { AdminCostsService } from './service';

export const Admin = new Elysia({
  prefix: '/admin/costs',
  tags: ['Admin'],
})
  .use(AdminGuard)
  .use(AdminCostsModel)
  .get(
    '/by-organization',
    async ({ query }) => {
      return AdminCostsService.getCostByOrganization({
        startMonth: query.startMonth,
        endMonth: query.endMonth,
      });
    },
    {
      query: 'AdminCostByOrganizationQuerySchema',
      response: 'AdminCostByOrganizationResponseSchema',
    },
  );
