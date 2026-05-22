import { Elysia } from 'elysia';
import { z } from 'zod';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { ErrorModel } from '../../common/models/error';
import { CalcomConnectionService } from './service';

export const CalcomConnection = new Elysia({
  prefix: '/calcom-connection',
  tags: ['Cal.com'],
})
  .use(AuthGuard)
  .use(ErrorModel)
  .get(
    '',
    async ({ orgId }) => {
      const connection = await CalcomConnectionService.findByOrg(orgId);
      return { connected: !!connection };
    },
    {
      response: {
        200: z.object({ connected: z.boolean() }),
      },
    },
  )
  .post(
    '',
    async ({ body, orgId }) => {
      await CalcomConnectionService.upsert(orgId, body.calApiKey);
      return { connected: true };
    },
    {
      body: z.object({ calApiKey: z.string().min(1) }),
      response: {
        200: z.object({ connected: z.boolean() }),
      },
    },
  )
  .delete(
    '',
    async ({ orgId, status }) => {
      const connection = await CalcomConnectionService.findByOrg(orgId);
      if (!connection) {
        return status(404, {
          code: 'NOT_FOUND',
          message: 'No Cal.com connection found',
        });
      }
      await CalcomConnectionService.delete(orgId);
      return { success: true };
    },
    {
      response: {
        200: z.object({ success: z.boolean() }),
        404: 'NotFoundResponse',
      },
    },
  );
