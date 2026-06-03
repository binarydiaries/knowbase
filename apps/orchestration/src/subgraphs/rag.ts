import { END, START, StateGraph } from '@langchain/langgraph';
import { rewriteQuery } from '../graph/nodes/rewriteQuery.js';
import { State } from '../graph/state.js';

const graph = new StateGraph(State)
  .addNode('rewriteQuery', rewriteQuery)
  // .addNode('vectorSearch', vectorSearch)
  // .addNode('generateResponse', generateRagResponse)
  .addEdge(START, 'rewriteQuery')
  // .addEdge('rewriteQuery', 'vectorSearch')
  // .addEdge('vectorSearch', 'generateResponse')
  .addEdge('rewriteQuery', END);

export const ragGraph = graph.compile();
