import { Elysia } from 'elysia';
import { ErrorModel } from '../../common/models/error';
import { BehaviourModel } from './model';
import { BehaviourService } from './service';

export const Behaviour = new Elysia({
  prefix: '/behaviour',
  tags: ['Behaviour'],
})
  .use(BehaviourModel)
  .use(ErrorModel)
  .guard({
    params: 'OneBehaviourParams',
    response: {
      404: 'NotFoundResponse',
    },
  })
  .resolve(async ({ params, status }) => {
    const behaviour = await BehaviourService.single(params.id);
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
    async ({ params, body }) => {
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
