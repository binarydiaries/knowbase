/**
 * One-time seed: migrate lead_generation agentActions → v2 workflows/workflowActions.
 *
 * Run once after the DB migration that adds the workflows and workflow_actions tables:
 *   bun run scripts/seed-v2-workflows.ts
 *
 * Safe to re-run — skips agents that already have a "lead_capture" workflow.
 */

import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '../src/db';
import { agentActions, type LeadGenerationConfig } from '../src/db/schema/agentActions';
import { workflows } from '../src/db/schema/workflows';
import { workflowActions } from '../src/db/schema/workflowActions';

async function main() {
  // 1. Find all enabled lead_generation actions
  const rows = await db.query.agentActions.findMany({
    where: { actionType: 'lead_generation', enabled: true },
  });

  if (rows.length === 0) {
    console.log('No lead_generation actions found — nothing to migrate.');
    return;
  }

  console.log(`Found ${rows.length} agent(s) with lead_generation configured.`);

  for (const action of rows) {
    // 2. Skip if this agent already has a lead_capture workflow
    const existing = await db.query.workflows.findFirst({
      where: { agentId: action.agentId, intentName: 'lead_capture' },
    });

    if (existing) {
      console.log(`  ⏭  Agent ${action.agentId} already has a lead_capture workflow — skipping.`);
      continue;
    }

    // 3. Derive requiredFields from the existing config
    //    Only include fields marked as collect: true AND required: true
    const cfg = action.config as LeadGenerationConfig;
    const fieldMap = cfg.fields ?? {
      name: { collect: true, required: true },
      email: { collect: true, required: true },
    };

    const requiredFields = Object.entries(fieldMap)
      .filter(([, v]) => v?.collect && v?.required)
      .map(([k]) => k);

    // 4. Create the workflow
    const workflowId = createId();
    await db.insert(workflows).values({
      id: workflowId,
      agentId: action.agentId,
      name: 'Lead Capture',
      intentName: 'lead_capture',
      requiredFields,
      executionMode: 'sequential',
      createdBy: action.createdBy,
    });

    // 5. Create the save_lead action for the workflow
    await db.insert(workflowActions).values({
      id: createId(),
      workflowId,
      order: 0,
      actionType: 'save_lead',
      config: {
        successMessage: cfg.successMessage ?? "Thanks! We'll be in touch.",
      },
    });

    console.log(`  ✓  Agent ${action.agentId} — created workflow "${workflowId}" with fields: [${requiredFields.join(', ')}]`);
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
