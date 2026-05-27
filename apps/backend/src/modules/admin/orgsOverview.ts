import { Elysia } from 'elysia';
import { AdminGuard } from '../../common/authGuard/adminGuard';
import { AdminOrgsOverviewModel } from './orgsOverview.model';
import { AdminOrgsOverviewService } from './orgsOverview.service';

export const AdminOrgsOverview = new Elysia({
  prefix: '/admin/orgs',
  tags: ['Admin'],
})
  .use(AdminGuard)
  .use(AdminOrgsOverviewModel)
  .get(
    '/overview',
    async () => {
      return AdminOrgsOverviewService.getOrgsOverview();
    },
    {
      response: 'AdminOrgsOverviewResponseSchema',
    },
  );
