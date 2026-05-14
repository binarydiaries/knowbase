import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { FeatureFlagService } from './service';

export const FeatureFlag = new Elysia({
  prefix: '/feature-flags',
  tags: ['Feature Flags'],
})
  .use(AuthGuard)
  .get('/', async ({ orgId }) => {
    return FeatureFlagService.getForOrg(orgId);
  });
