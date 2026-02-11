import { Elysia } from 'elysia';
import { clerkPlugin } from 'elysia-clerk';

export const ClerkModule = new Elysia()
  .use(clerkPlugin())
  .resolve(({ auth }) => {
    const authResponse = auth();
    const { userId, orgId } = authResponse;

    if (!userId || !orgId) {
      throw new Error('Not authenticated');
    }

    return {
      authResponse,
    };
  });
