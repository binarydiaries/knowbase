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
  .get(
    '',
    async () => {
      const behaviours = await BehaviourService.list();
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
    },
  })
  .resolve(async ({ params, status }) => {
    const newParams = params as { id: string };
    const behaviour = await BehaviourService.single(newParams.id);
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
