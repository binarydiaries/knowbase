import { END, START, StateGraph } from '@langchain/langgraph';
import { checkRequirements } from '../nodes/checkRequirements';
import { collectMissingData } from '../nodes/collectMissingData';
import { executeAction } from '../nodes/executeAction';
import { loadWorkflow } from '../nodes/loadWorkflow';
import { State } from '../state';

function routeAfterRequirementCheck(
  state: typeof State.State,
): 'collectMissingData' | 'executeAction' {
  return state.missingFields.length > 0
    ? 'collectMissingData'
    : 'executeAction';
}

const graph = new StateGraph(State)
  // Nodes
  .addNode('loadWorkflow', loadWorkflow)
  .addNode('checkRequirements', checkRequirements)
  .addNode('collectMissingData', collectMissingData)
  .addNode('executeAction', executeAction)

  .addConditionalEdges('checkRequirements', routeAfterRequirementCheck, {
    collectMissingData: 'collectMissingData',
    executeAction: 'executeAction',
  })

  // Edges
  .addEdge(START, 'loadWorkflow')
  .addEdge('loadWorkflow', 'checkRequirements')
  .addEdge('checkRequirements', 'collectMissingData')
  .addEdge('collectMissingData', END)
  .addEdge('executeAction', END);

export const workflowGraph = graph.compile();
