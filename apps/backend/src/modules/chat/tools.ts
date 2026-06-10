import { tool } from 'ai';
import { z } from 'zod';

type LeadFieldConfig = { collect: boolean; required: boolean };
export type LeadGenerationConfig = {
  fields?: {
    name?: LeadFieldConfig;
    email?: LeadFieldConfig;
    phone?: LeadFieldConfig;
    company?: LeadFieldConfig;
  };
  triggerInstructions?: string;
  successMessage?: string;
};

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
      `Capture the user's contact information. Call this tool only after all required fields have been collected through conversation — check prior messages for values already provided and do not re-ask for them.${triggerInstruction}`,
    inputSchema: z.object(schemaShape),
    execute: async (_input) => ({ captured: true }),
  });
}
