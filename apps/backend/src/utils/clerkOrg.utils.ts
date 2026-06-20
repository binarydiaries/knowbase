import { clerkClient } from 'elysia-clerk';

export async function fetchOrgUserInfo(
  orgId: string,
  userId: string,
): Promise<{ name: string | null; email: string | null }> {
  try {
    const [org, user] = await Promise.all([
      clerkClient.organizations.getOrganization({ organizationId: orgId }),
      clerkClient.users.getUser(userId),
    ]);
    return {
      name: org.name ?? null,
      email: user.primaryEmailAddress?.emailAddress ?? null,
    };
  } catch {
    return { name: null, email: null };
  }
}

export async function resolveOrgNames(orgIds: string[]): Promise<Map<string, string>> {
  if (orgIds.length === 0) return new Map();

  const results = await Promise.allSettled(
    orgIds.map((id) => clerkClient.organizations.getOrganization({ organizationId: id })),
  );

  const map = new Map<string, string>();
  for (let i = 0; i < orgIds.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      map.set(orgIds[i], result.value.name);
    }
  }
  return map;
}
