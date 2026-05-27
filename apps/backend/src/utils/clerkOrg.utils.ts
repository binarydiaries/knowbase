import { clerkClient } from 'elysia-clerk';

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
