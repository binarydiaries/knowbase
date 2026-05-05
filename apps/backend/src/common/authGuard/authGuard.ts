import * as Sentry from '@sentry/elysia';
import { Elysia } from 'elysia';
import { clerkClient, clerkPlugin } from 'elysia-clerk';
import { ClerkModel } from './model';

export const AuthGuard = new Elysia({ name: 'auth-guard' })
  .use(clerkPlugin())
  .use(ClerkModel)
  .guard({
    response: {
      401: 'UnauthorizedSchema',
    },
  })
  .resolve(async ({ auth, status }) => {
    const { userId, orgId } = auth();

    if (!userId || !orgId) {
      throw status(401, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }
    const user = await clerkClient.users.getUser(userId);

    Sentry.setUser({
      id: userId,
      email: user.primaryEmailAddress?.emailAddress,
    });

    return {
      userId,
      orgId,
    };
  })
  .as('scoped');
