import { db } from '../db/index.js';
import { leads } from '../db/schema.js';
import type { ActionContext } from '../graph/nodes/execute-actions.js';
import type { ActionResult } from '../graph/state.js';

type SaveLeadConfig = {
  successMessage?: string;
};

export async function executeSaveLead(
  config: Record<string, unknown>,
  ctx: ActionContext,
): Promise<ActionResult> {
  const { agentId, conversationId, channelId, orgId, entities } = ctx;
  const _cfg = config as SaveLeadConfig;

  try {
    const rows = await db
      .insert(leads)
      .values({
        agentId,
        conversationId: conversationId || undefined,
        channelId: channelId || undefined,
        orgId,
        name: (entities.name as string) ?? null,
        email: (entities.email as string) ?? null,
        phone: (entities.phone as string) ?? null,
        company: (entities.company as string) ?? null,
      })
      .returning();

    const lead = rows[0];

    // Fire lead notification email via the backend's BullMQ queue by calling
    // the backend webhook endpoint — the orchestration has no direct queue access.
    // This is best-effort and should not block the response.
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
    fetch(`${backendUrl}/internal/leads/${lead?.id}/notify`, {
      method: 'POST',
      headers: { 'x-internal-secret': process.env.INTERNAL_SECRET ?? '' },
    }).catch(() => {});

    return { success: true, data: { leadId: lead?.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save lead',
    };
  }
}
