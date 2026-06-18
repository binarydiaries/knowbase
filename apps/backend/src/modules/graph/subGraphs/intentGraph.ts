import { END, START, StateGraph } from '@langchain/langgraph';
import { checkRequirements } from '../nodes/checkRequirements';
import { collectMissingData } from '../nodes/collectMissingData';
import { executeActions } from '../nodes/executeActions';
import { loadIntent } from '../nodes/loadIntent';
import { State } from '../state';

function routeAfterRequirementCheck(
  state: typeof State.State,
): 'collectMissingData' | 'executeActions' {
  if (state.missingFields.length > 0) return 'collectMissingData';
  if (state.optionalMissingFields.length > 0 && !state.askedOptionalFields) return 'collectMissingData';
  return 'executeActions';
}

const graph = new StateGraph(State)
  // Nodes
  .addNode('loadIntent', loadIntent)
  .addNode('checkRequirements', checkRequirements)
  .addNode('collectMissingData', collectMissingData)
  .addNode('executeActions', executeActions)

  .addConditionalEdges('checkRequirements', routeAfterRequirementCheck, {
    collectMissingData: 'collectMissingData',
    executeActions: 'executeActions',
  })

  // Edges
  .addEdge(START, 'loadIntent')
  .addEdge('loadIntent', 'checkRequirements')
  .addEdge('collectMissingData', END)
  .addEdge('executeActions', END);

export const intentGraph = graph.compile();
