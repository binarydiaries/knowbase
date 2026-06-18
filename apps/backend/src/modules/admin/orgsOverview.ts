import { Elysia } from 'elysia';
import { AdminGuard } from '../../common/authGuard/adminGuard';
import { AdminOrgsOverviewService } from './orgsOverview.service';

export const AdminOrgsOverview = new Elysia({
  prefix: '/admin/orgs',
  tags: ['Admin'],
})
  .use(AdminGuard)
  .get('/overview', async () => {
    return AdminOrgsOverviewService.getOrgsOverview();
  });
