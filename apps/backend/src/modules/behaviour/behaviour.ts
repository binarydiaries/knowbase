import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { ChatbotService } from '../chatbot/service';
import { SubscriptionService } from '../subscription/service';
import { BehaviourModel } from './model';
import { BehaviourService } from './service';

export const Behaviour = new Elysia({
  prefix: '/behaviour',
  tags: ['Behaviour'],
})
  .use(AuthGuard)
  .use(BehaviourModel)
  .use(ErrorModel)
  .get(
    '',
    async ({ orgId }) => {
      const behaviours = await BehaviourService.list({ orgId });
      return {
        behaviours,
      };
    },
    {
      response: 'ManyBehaviourResponse',
    },
  )
  .guard({
    response: {
      404: 'NotFoundResponse',
      403: 'ChatbotLockedResponse',
    },
  })
  .resolve(async ({ params, status, orgId }) => {
    const newParams = params as { id: string };
    const behaviour = await BehaviourService.single({
      id: newParams.id,
      orgId,
    });
    if (!behaviour) {
      return status(404, {
        code: 'NOT_FOUND',
        message: 'Behaviour not found',
      });
    }
    return { behaviour };
  })
  .patch(
    '/:id',
    async ({ params, body, behaviour, orgId, status }) => {
      const chatbot = await ChatbotService.single({
        id: behaviour.chatbotId,
        orgId,
      });

      if (!chatbot) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'Chatbot not found',
        });
      }

      const subscription = await SubscriptionService.getStatus(orgId);
      if (subscription.isOverLimit) {
        return status(403, {
          code: 'CHATBOT_LOCKED',
          message: SubscriptionService.getLockedMessage(subscription),
          plan: subscription.plan,
          activeChatbotLimit: subscription.activeChatbotLimit,
          activeChatbotCount: subscription.activeChatbotCount,
        });
      }

      return {
        behaviour: await BehaviourService.update(params.id, body),
      };
    },
    {
      body: 'UpdateBehaviourBody',
      response: {
        200: 'OneBehaviourResponse',
      },
    },
  );
