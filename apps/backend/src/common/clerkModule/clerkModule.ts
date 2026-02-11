import { Elysia } from 'elysia';
import { clerkPlugin } from 'elysia-clerk';
import { ClerkModel } from './model';

export const AuthGuard = () =>
  new Elysia({ name: 'auth-guard' })
    .use(clerkPlugin())
    .use(ClerkModel)
    .guard({
      response: {
        401: 'UnauthorizedSchema',
      },
    })
    .resolve(({ auth, status }) => {
      const { userId, orgId } = auth();

      if (!userId || !orgId) {
        throw status(401, {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      return {
        userId,
        orgId,
      };
    });
