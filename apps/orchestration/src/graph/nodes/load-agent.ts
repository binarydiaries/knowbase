import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { agents, behaviors, workflows, workflowActions } from '../../db/schema.js';
import type { AgentState, AgentStateUpdate, WorkflowDef } from '../state.js';

export async function loadAgent(state: AgentState): Promise<AgentStateUpdate> {
  const { agentId } = state;

  // Load behavior (system prompt, tone, etc.)
  const behavior = await db
    .select()
    .from(behaviors)
    .where(eq(behaviors.agentId, agentId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!behavior) {
    throw new Error(`No behavior found for agent ${agentId}`);
  }

  // Load workflows + their actions for this agent
  const rawWorkflows = await db
    .select()
    .from(workflows)
    .where(eq(workflows.agentId, agentId));

  const workflowDefs: WorkflowDef[] = await Promise.all(
    rawWorkflows.map(async (wf) => {
      const actions = await db
        .select()
        .from(workflowActions)
        .where(eq(workflowActions.workflowId, wf.id))
        .orderBy(workflowActions.order);

      return {
        id: wf.id,
        name: wf.name,
        intentName: wf.intentName,
        requiredFields: wf.requiredFields ?? [],
        executionMode: wf.executionMode,
        actions: actions.map((a) => ({
          id: a.id,
          order: a.order,
          actionType: a.actionType,
          config: (a.config as Record<string, unknown>) ?? {},
        })),
      };
    }),
  );

  return {
    agentConfig: {
      systemPrompt: behavior.systemPrompt,
      tone: behavior.tone,
      verbosity: behavior.verbosity,
      fallbackMessage: behavior.fallbackMessage,
      guardrails: behavior.guardrails,
    },
    workflows: workflowDefs,
  };
}
