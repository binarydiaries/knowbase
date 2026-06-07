import { END, START, StateGraph } from '@langchain/langgraph';
import { checkRequirements } from '../nodes/checkRequirements';
import { collectMissingData } from '../nodes/collectMissingData';
import { loadWorkflow } from '../nodes/loadWorkflow';
import { State } from '../state';

const graph = new StateGraph(State)
  // Nodes
  .addNode('loadWorkflow', loadWorkflow)
  .addNode('checkRequirements', checkRequirements)
  .addNode('collectMissingData', collectMissingData)

  // Edges
  .addEdge(START, 'loadWorkflow')
  .addEdge('loadWorkflow', 'checkRequirements')
  .addEdge('checkRequirements', 'collectMissingData')
  .addEdge('collectMissingData', END);

export const workflowGraph = graph.compile();
