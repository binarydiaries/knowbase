import { LeadService } from '../../lead/service';
import type { ActionContext, IActionResult } from './types';

export async function saveLead(ctx: ActionContext): Promise<IActionResult> {
  const { name, email, phone, company } = ctx.entities;

  const lead = await LeadService.create({
    agentId: ctx.agentId,
    orgId: ctx.orgId,
    channelId: ctx.channelId,
    conversationId: ctx.conversationId,
    name: name ?? null,
    email: email ?? null,
    phone: phone ?? null,
    company: company ?? null,
  });

  return { success: true, data: { leadId: lead.id } };
}
