import { END, START, StateGraph } from '@langchain/langgraph';
import { loadWorkflow } from '../nodes/loadWorkflow';
import { State } from '../state';

const graph = new StateGraph(State)
  // Nodes
  .addNode('loadWorkflow', loadWorkflow)

  // Edges
  .addEdge(START, 'loadWorkflow')
  .addEdge('loadWorkflow', END);

export const workflowGraph = graph.compile();
