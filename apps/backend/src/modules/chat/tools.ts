import { tool } from 'ai';
import { z } from 'zod';
import type { LeadGenerationConfig } from '../../db/schema/chatbotActions';

export function buildLeadCaptureTool(config: LeadGenerationConfig) {
  const fields = config.fields ?? {
    name: { collect: true, required: true },
    email: { collect: true, required: true },
  };

  const schemaShape: Record<string, z.ZodTypeAny> = {};

  if (fields.name?.collect) {
    const base = z.string().describe("The user's full name");
    schemaShape.name = fields.name.required ? base : base.optional();
  }
  if (fields.email?.collect) {
    const base = z.string().email().describe("The user's email address");
    schemaShape.email = fields.email.required ? base : base.optional();
  }
  if (fields.phone?.collect) {
    const base = z.string().describe("The user's phone number");
    schemaShape.phone = fields.phone.required ? base : base.optional();
  }
  if (fields.company?.collect) {
    const base = z.string().describe("The user's company or organization");
    schemaShape.company = fields.company.required ? base : base.optional();
  }

  const triggerInstruction = config.triggerInstructions
    ? ` ${config.triggerInstructions}`
    : '';

  return tool({
    description:
      `Capture the user's contact information when they express interest in being contacted, want a follow-up, ask to speak to someone, or request more information.${triggerInstruction} Collect each required field through natural conversation before calling this tool.`,
    inputSchema: z.object(schemaShape),
  });
}
