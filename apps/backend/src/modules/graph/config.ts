import { z } from 'zod';

export const ConfigSchema = z.object({
  agentId: z.string().optional().describe('Agent ID from the dashboard'),
  orgId: z.string().optional().describe('Clerk organisation ID'),
  channelId: z.string().optional().describe('Channel ID the message came from'),
  ip: z
    .string()
    .optional()
    .describe('Client IP address (for geo enrichment, optional)'),
  isPaid: z
    .boolean()
    .optional()
    .describe('Whether the org is on a paid plan — gates sentiment scoring'),
});
