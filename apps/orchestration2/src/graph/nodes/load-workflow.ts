import type { AgentState, AgentStateUpdate } from '../state.js';

export function loadWorkflow(state: AgentState): AgentStateUpdate {
  const { intent, workflows } = state;

  const workflow = workflows.find((w) => w.intentName === intent);
  return { activeWorkflow: workflow };
}
