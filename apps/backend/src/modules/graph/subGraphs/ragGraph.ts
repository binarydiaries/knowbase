import { END, START, StateGraph } from '@langchain/langgraph';
import { generateRagResponse } from '../nodes/generateRagResponse';
import { rewriteQuery } from '../nodes/rewriteQuery';
import { vectorSearch } from '../nodes/vectorSearch';
import { State } from '../state';

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
