import { END, START, StateGraph } from '@langchain/langgraph';
import { generateRagResponse } from '../graph/nodes/generateResponse.js';
import { rewriteQuery } from '../graph/nodes/rewriteQuery.js';
import { vectorSearch } from '../graph/nodes/vectorSearch.js';
import { State } from '../graph/state.js';

const graph = new StateGraph(State)
  // Nodes
  .addNode('rewriteQuery', rewriteQuery)
  .addNode('vectorSearch', vectorSearch)
  .addNode('generateResponse', generateRagResponse)

  // Edges
  .addEdge(START, 'rewriteQuery')
  .addEdge('rewriteQuery', 'vectorSearch')
  .addEdge('vectorSearch', 'generateResponse')
  .addEdge('generateResponse', END);

export const ragGraph = graph.compile();
