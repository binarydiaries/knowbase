import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { ChannelService } from '../channel/service';
import { DocumentService } from '../document/service';
import { SubscriptionService } from '../subscription/service';
import { AgentModel } from './model';
import { AgentService } from './service';

export const Agent = new Elysia({
  prefix: '/agents',
  tags: ['Agent'],
})
  .use(AuthGuard)
  .use(AgentModel)
  .use(ErrorModel)
  .post(
    '',
    async ({ body, userId, orgId, status }) => {
      const agentLimit = await SubscriptionService.assertAgentLimitNotReached(orgId);

      if (!agentLimit.allowed) {
        return status(403, {
          code: 'AGENT_LIMIT_REACHED',
          message: SubscriptionService.getLimitReachedMessage(agentLimit),
          plan: agentLimit.plan,
          activeAgentLimit: agentLimit.activeAgentLimit,
          activeAgentCount: agentLimit.activeAgentCount,
        });
      }

      const agent = await AgentService.create({
        ...body,
        createdBy: userId,
        orgId,
      });
      return { agent };
    },
    {
      body: 'CreateAgentBody',
      response: {
        200: 'OneSmallAgentResponse',
        403: 'AgentRestrictedResponse',
      },
    },
  )
  .get(
    '',
    async ({ orgId }) => {
      const subscription = await SubscriptionService.getStatus(orgId);
      const agents = await AgentService.list({ orgId });
      return {
        agents: agents.map((agent) => ({
          ...agent,
          locked: SubscriptionService.isAgentLocked({
            subscriptionStatus: subscription,
          }),
        })),
        subscription,
      };
    },
    {
      response: 'ManyAgentResponse',
    },
  )
  .guard({
    response: {
      404: 'NotFoundResponse',
      403: 'AgentLockedResponse',
    },
  })
  .get(
    '/:id',
    async ({ params, orgId, status }) => {
      const subscription = await SubscriptionService.getStatus(orgId);
      const agent = await AgentService.singleWithRelations({ id: params.id, orgId });

      if (!agent) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }
      const { behaviour, channels, documents, ...otherAgent } = agent;
      return {
        agent: {
          ...otherAgent,
          locked: SubscriptionService.isAgentLocked({
            subscriptionStatus: subscription,
          }),
        },
        // biome-ignore lint/style/noNonNullAssertion: Will fix later
        behaviour: behaviour!,
        documents: documents.map(DocumentService.transformDocument),
        channels: channels.map(ChannelService.transformChannel),
        subscription,
      };
    },
    {
      response: {
        200: 'OneAgentResponse',
      },
    },
  )
  .resolve(async ({ params, status, orgId }) => {
    const newParams = params as { id: string };
    const agent = await AgentService.single({ id: newParams.id, orgId });

    if (!agent) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'Agent not found',
      });
    }
    return { agent };
  })
  .patch(
    '/:id',
    async ({ params, body, agent, orgId, status }) => {
      const subscription = await SubscriptionService.getStatus(orgId);
      const changedKeys = Object.entries(body).filter(([, value]) => value !== undefined);
      const isArchiveOnly =
        agent.agentStatus === 'active' &&
        body.agentStatus === 'archived' &&
        changedKeys.length === 1 &&
        changedKeys[0]?.[0] === 'agentStatus';
      const isUnarchive =
        agent.agentStatus === 'archived' && body.agentStatus === 'active';

      if (subscription.isOverLimit && !isArchiveOnly) {
        if (isUnarchive || SubscriptionService.hasReachedAgentLimit(subscription)) {
          return status(403, {
            code: 'AGENT_LIMIT_REACHED',
            message: SubscriptionService.getLimitReachedMessage(subscription),
            plan: subscription.plan,
            activeAgentLimit: subscription.activeAgentLimit,
            activeAgentCount: subscription.activeAgentCount,
          });
        }

        return status(403, {
          code: 'AGENT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
        });
      }

      if (isUnarchive && SubscriptionService.hasReachedAgentLimit(subscription)) {
        return status(403, {
          code: 'AGENT_LIMIT_REACHED',
          message: SubscriptionService.getLimitReachedMessage(subscription),
          plan: subscription.plan,
          activeAgentLimit: subscription.activeAgentLimit,
          activeAgentCount: subscription.activeAgentCount,
        });
      }

      return {
        agent: await AgentService.update(params.id, { ...body }),
      };
    },
    {
      body: 'UpdateAgentBody',
      response: {
        200: 'OneSmallAgentResponse',
        403: 'AgentRestrictedResponse',
      },
    },
  );
