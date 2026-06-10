import { Elysia } from 'elysia';
import z from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { AgentService } from '../agent/service';
import { SubscriptionService } from '../subscription/service';
import { WorkflowModel } from './workflowModel';
import { WorkflowService } from './service';

export const Workflow = new Elysia({ prefix: '/workflows', tags: ['Workflows'] })
  .use(AuthGuard)
  .use(WorkflowModel)
  .use(ErrorModel)
  .get(
    '',
    async ({ query, orgId, status }) => {
      const { agentId } = query;
      const agent = await AgentService.single({ id: agentId, orgId });
      if (!agent) {
        return status(404, { code: 'NOT_FOUND', message: 'Agent not found' });
      }
      const workflows = await WorkflowService.listWithActions(agentId);
      return { workflows };
    },
    {
      query: z.object({ agentId: z.string() }),
      response: {
        200: 'ManyWorkflowsResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .post(
    '',
    async ({ body, orgId, userId, status }) => {
      // Lead gen workflows require Starter+ plan
      const hasSaveLead = body.actions.some((a) => a.actionType === 'save_lead');
      if (hasSaveLead) {
        const access = await SubscriptionService.assertLeadGenerationAccess(orgId);
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

      const workflow = await WorkflowService.create(
        {
          agentId: body.agentId,
          name: body.name,
          intentName: body.intentName,
          triggerInstructions: body.triggerInstructions,
          requiredFields: body.requiredFields,
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

      return { workflow };
    },
    {
      body: 'CreateWorkflowBody',
      response: {
        200: 'OneWorkflowResponse',
        403: 'LeadGenerationForbiddenResponse',
        404: 'NotFoundResponse',
      },
    },
  )
  .guard({ response: { 404: 'NotFoundResponse' } })
  .patch(
    '/:id',
    async ({ params, body, orgId, status }) => {
      const existing = await WorkflowService.singleWithActions({
        id: params.id,
        orgId,
      });
      if (!existing) {
        return status(404, { code: 'NOT_FOUND', message: 'Workflow not found' });
      }

      // Re-check plan access if save_lead action is being added
      const addingSaveLead = body.actions?.some((a) => a.actionType === 'save_lead');
      if (addingSaveLead) {
        const access = await SubscriptionService.assertLeadGenerationAccess(orgId);
        if (!access.allowed) {
          return status(403, {
            code: 'PLAN_LIMIT_REACHED',
            message:
              'Lead generation is available on the Starter plan and above. Upgrade your plan to use this feature.',
          });
        }
      }

      const workflow = await WorkflowService.update(
        params.id,
        {
          name: body.name,
          intentName: body.intentName,
          triggerInstructions: body.triggerInstructions,
          requiredFields: body.requiredFields,
          config: body.config ?? undefined,
        },
        body.actions?.map((a) => ({
          actionType: a.actionType,
          order: a.order,
          config: a.config,
        })),
      );

      return { workflow };
    },
    {
      body: 'UpdateWorkflowBody',
      response: {
        200: 'OneWorkflowResponse',
        403: 'LeadGenerationForbiddenResponse',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, orgId, status }) => {
      const existing = await WorkflowService.singleWithActions({
        id: params.id,
        orgId,
      });
      if (!existing) {
        return status(404, { code: 'NOT_FOUND', message: 'Workflow not found' });
      }
      await WorkflowService.delete(params.id);
      return { success: true };
    },
    {
      response: {
        200: 'DeleteWorkflowResponse',
      },
    },
  );
