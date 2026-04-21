import { clerkClient } from 'elysia-clerk';
import { Elysia } from 'elysia';
import { AuthGuard } from './authGuard';

function parseAllowlist(value: string | undefined): Set<string> {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getPrimaryEmail(user: Awaited<ReturnType<typeof clerkClient.users.getUser>>) {
  const primaryId = user.primaryEmailAddressId;
  const primary = user.emailAddresses.find((email) => email.id === primaryId);
  return primary?.emailAddress?.toLowerCase() ?? null;
}

const adminEmails = parseAllowlist(process.env.ADMIN_EMAILS);
const adminUserIds = parseAllowlist(process.env.ADMIN_USER_IDS);

export const AdminGuard = new Elysia({ name: 'admin-guard' })
  .use(AuthGuard)
  .guard({
    response: {
      403: 'ForbiddenSchema',
    },
  })
  .resolve(async ({ userId, status }) => {
    const normalizedUserId = userId.toLowerCase();

    if (adminUserIds.has(normalizedUserId)) {
      return { adminUserId: userId };
    }

    try {
      const user = await clerkClient.users.getUser(userId);
      const email = getPrimaryEmail(user);

      if (email && adminEmails.has(email)) {
        return { adminUserId: userId, adminEmail: email };
      }
    } catch {
      // Ignore clerk lookup failures; fall through to forbidden.
    }

    throw status(403, {
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  })
  .as('scoped');
