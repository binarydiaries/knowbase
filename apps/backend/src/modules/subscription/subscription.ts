import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { SubscriptionModel } from './model';
import { SubscriptionService } from './service';

export const Subscription = new Elysia({
  prefix: '/subscriptions',
  tags: ['Subscription'],
})
  .use(AuthGuard)
  .use(SubscriptionModel)
  .get(
    '/status',
    async ({ orgId }) => {
      return SubscriptionService.getStatus(orgId);
    },
    {
      response: 'SubscriptionStatusSchema',
    },
  );
