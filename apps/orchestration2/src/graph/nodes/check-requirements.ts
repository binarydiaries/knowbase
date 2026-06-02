import type { AgentState, AgentStateUpdate } from '../state.js';

export function checkRequirements(state: AgentState): AgentStateUpdate {
  const { activeWorkflow, entities } = state;

  if (!activeWorkflow) {
    return { missingFields: [] };
  }

  const missing = activeWorkflow.requiredFields.filter((field) => {
    const value = entities[field];
    return value === undefined || value === null || value === '';
  });

  return { missingFields: missing };
}
