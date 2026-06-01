import { END, START, StateGraph } from '@langchain/langgraph';
import { AgentStateAnnotation } from '../../state.js';
import { loadWorkflow } from '../../nodes/load-workflow.js';
import { checkRequirements } from '../../nodes/check-requirements.js';
import { collectMissingData } from '../data-collection/index.js';
import { executeActions } from '../../nodes/execute-actions.js';
import { generateWorkflowResponse } from '../../nodes/generate-response.js';
import type { AgentState } from '../../state.js';

function routeAfterRequirementCheck(state: AgentState): 'collectData' | 'executeActions' {
  return state.missingFields.length > 0 ? 'collectData' : 'executeActions';
}

export function buildWorkflowSubgraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    .addNode('loadWorkflow', loadWorkflow)
    .addNode('checkRequirements', checkRequirements)
    .addNode('collectData', collectMissingData)
    .addNode('executeActions', executeActions)
    .addNode('generateResponse', generateWorkflowResponse)
    .addEdge(START, 'loadWorkflow')
    .addEdge('loadWorkflow', 'checkRequirements')
    .addConditionalEdges('checkRequirements', routeAfterRequirementCheck, {
      collectData: 'collectData',
      executeActions: 'executeActions',
    })
    .addEdge('collectData', END) // suspend — wait for next user message
    .addEdge('executeActions', 'generateResponse')
    .addEdge('generateResponse', END);

  return graph.compile();
}
