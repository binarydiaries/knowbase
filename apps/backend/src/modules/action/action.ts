import { Elysia } from 'elysia';
import z from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { AgentService } from '../agent/service';
import { SubscriptionService } from '../subscription/service';
import { ActionModel } from './model';
import { ActionService } from './service';

export const Action = new Elysia({
  prefix: '/agent-actions',
  tags: ['Actions'],
})
  .use(AuthGuard)
  .use(ActionModel)
  .use(ErrorModel)
  .get(
    '',
    async ({ query, orgId }) => {
      const { agentId } = query;
      const actions = await ActionService.getByAgent(agentId);
      return { actions };
    },
    {
      query: z.object({
        agentId: z.string(),
      }),
      response: {
        200: 'ManyAgentActionResponse',
      },
    },
  )
  .post(
    '',
    async ({ body, orgId, userId, status }) => {
      if (body.actionType === 'lead_generation') {
        const access =
          await SubscriptionService.assertLeadGenerationAccess(orgId);
        if (!access.allowed) {
          return status(403, {
            code: 'PLAN_LIMIT_REACHED',
            message:
              'Lead generation is available on the Starter plan and above. Upgrade your plan to use this feature.',
          });
        }
      }

      const agent = await AgentService.single({ id: body.agentId, orgId });
      if (!agent) {
        return status(404, { code: 'NOT_FOUND', message: 'Agent not found' });
      }

      const action = await ActionService.create({
        agentId: body.agentId,
        actionType: body.actionType,
        config: body.config ?? {},
        createdBy: userId,
      });
      return { action };
    },
    {
      body: 'CreateAgentActionBody',
      response: {
        200: 'OneAgentActionResponse',
        403: 'LeadGenerationForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .guard({
    response: {
      404: 'NotFoundResponse',
    },
  })
  .patch(
    '/:id',
    async ({ params, body, orgId, status }) => {
      const existing = await ActionService.single({ id: params.id, orgId });
      if (!existing) {
        return status(404, { code: 'NOT_FOUND', message: 'Action not found' });
      }

      // Block free plan from enabling lead generation
      if (existing.actionType === 'lead_generation' && body.enabled === true) {
        const access =
          await SubscriptionService.assertLeadGenerationAccess(orgId);
        if (!access.allowed) {
          return status(403, {
            code: 'PLAN_LIMIT_REACHED',
            message:
              'Lead generation is available on the Starter plan and above. Upgrade your plan to use this feature.',
          });
        }
      }

      const action = await ActionService.update(params.id, body);
      return { action };
    },
    {
      body: 'UpdateAgentActionBody',
      response: {
        200: 'OneAgentActionResponse',
        403: 'LeadGenerationForbiddenResponse',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, orgId, status }) => {
      const existing = await ActionService.single({ id: params.id, orgId });
      if (!existing) {
        return status(404, { code: 'NOT_FOUND', message: 'Action not found' });
      }
      await ActionService.delete(params.id);
      return { success: true };
    },
    {
      response: {
        200: 'DeleteActionResponse',
      },
    },
  );
