import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { LeadModel } from './model';
import { LeadService } from './service';

export const Lead = new Elysia({
  prefix: '/leads',
  tags: ['Leads'],
})
  .use(AuthGuard)
  .use(LeadModel)
  .get(
    '',
    async ({ query, orgId }) => {
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
      },
    },
  );
