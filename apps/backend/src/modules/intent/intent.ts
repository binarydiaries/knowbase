import { Elysia } from 'elysia';
import z from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { AgentService } from '../agent/service';
import { SubscriptionService } from '../subscription/service';
import { IntentModel } from './intentModel';
import { IntentService } from './service';

export const Intent = new Elysia({ prefix: '/intents', tags: ['Intents'] })
  .use(AuthGuard)
  .use(IntentModel)
  .use(ErrorModel)
  .get(
    '',
    async ({ query, orgId, status }) => {
      const { agentId } = query;
      const agent = await AgentService.single({ id: agentId, orgId });
      if (!agent) {
        return status(404, { code: 'NOT_FOUND', message: 'Agent not found' });
      }
      const intents = await IntentService.listWithActions(agentId);
      return { intents };
    },
    {
      query: z.object({ agentId: z.string() }),
      response: {
        200: 'ManyIntentsResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .post(
    '',
    async ({ body, orgId, userId, status }) => {
      // Lead gen intents require Starter+ plan
      const hasSaveLead = body.actions.some(
        (a) => a.actionType === 'save_lead',
      );
      if (hasSaveLead) {
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

      // API call actions require Starter+ plan
      const hasApiTrigger = body.actions.some(
        (a) => a.actionType === 'api_trigger',
      );
      if (hasApiTrigger) {
        const access =
          await SubscriptionService.assertApiCallActionAccess(orgId);
        if (!access.allowed) {
          return status(403, {
            code: 'PLAN_LIMIT_REACHED',
            message:
              'API call actions are available on the Starter plan and above. Upgrade your plan to use this feature.',
          });
        }
      }

      const agent = await AgentService.single({ id: body.agentId, orgId });
      if (!agent) {
        return status(404, { code: 'NOT_FOUND', message: 'Agent not found' });
      }

      const intent = await IntentService.create(
        {
          agentId: body.agentId,
          name: body.name,
          triggerInstructions: body.triggerInstructions,
          requiredFields: body.requiredFields,
          optionalFields: body.optionalFields,
          executionMode: body.executionMode,
          config: body.config ?? null,
          createdBy: userId,
        },
        body.actions.map((a) => ({
          actionType: a.actionType,
          order: a.order,
          config: a.config,
        })),
      );

      return { intent };
    },
    {
      body: 'CreateIntentBody',
      response: {
        200: 'OneIntentResponse',
        403: 'LeadGenerationForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .guard({ response: { 404: 'NotFoundResponse' } })
  .patch(
    '/:id',
    async ({ params, body, orgId, status }) => {
      const existing = await IntentService.singleWithActions({
        id: params.id,
        orgId,
      });
      if (!existing) {
        return status(404, { code: 'NOT_FOUND', message: 'Intent not found' });
      }

      // Re-check plan access if save_lead action is being added
      const addingSaveLead = body.actions?.some(
        (a) => a.actionType === 'save_lead',
      );
      if (addingSaveLead) {
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

      // Re-check plan access if api_trigger action is being added
      const addingApiTrigger = body.actions?.some(
        (a) => a.actionType === 'api_trigger',
      );
      if (addingApiTrigger) {
        const access =
          await SubscriptionService.assertApiCallActionAccess(orgId);
        if (!access.allowed) {
          return status(403, {
            code: 'PLAN_LIMIT_REACHED',
            message:
              'API call actions are available on the Starter plan and above. Upgrade your plan to use this feature.',
          });
        }
      }

      const intent = await IntentService.update(
        params.id,
        {
          name: body.name,
          triggerInstructions: body.triggerInstructions,
          requiredFields: body.requiredFields,
          optionalFields: body.optionalFields,
          config: body.config ?? undefined,
        },
        body.actions?.map((a) => ({
          actionType: a.actionType,
          order: a.order,
          config: a.config,
        })),
      );

      return { intent };
    },
    {
      body: 'UpdateIntentBody',
      response: {
        200: 'OneIntentResponse',
        403: 'LeadGenerationForbiddenResponse',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, orgId, status }) => {
      const existing = await IntentService.singleWithActions({
        id: params.id,
        orgId,
      });
      if (!existing) {
        return status(404, { code: 'NOT_FOUND', message: 'Intent not found' });
      }
      await IntentService.delete(params.id);
      return { success: true };
    },
    {
      response: {
        200: 'DeleteIntentResponse',
      },
    },
  );
