import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { SubscriptionService } from '../subscription/service';
import { LeadModel } from './model';
import { LeadService } from './service';

export const Lead = new Elysia({
  prefix: '/leads',
  tags: ['Leads'],
})
  .use(AuthGuard)
  .use(LeadModel)
  .use(ErrorModel)
  .get(
    '',
    async ({ query, orgId, status }) => {
      const access = await SubscriptionService.assertLeadGenerationAccess(orgId);
      if (!access.allowed) {
        return status(403, {
          code: 'PLAN_LIMIT_REACHED',
          message: 'Lead generation is available on the Starter plan and above. Upgrade your plan to access leads.',
        });
      }

      const { chatbotId, page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      const [leads, total] = await Promise.all([
        LeadService.list({ orgId, chatbotId, limit, offset }),
        LeadService.count({ orgId, chatbotId }),
      ]);

      return { leads, total, page, limit };
    },
    {
      query: 'GetLeadsQuery',
      response: {
        200: 'ManyLeadsResponse',
        403: 'LeadGenerationForbiddenResponse',
      },
    },
  );
