import { END, START, StateGraph } from '@langchain/langgraph';
import { AgentStateAnnotation } from '../../state.js';
import { rewriteQuery } from '../../nodes/rewrite-query.js';
import { vectorSearch } from '../../nodes/vector-search.js';
import { generateRagResponse } from '../../nodes/generate-response.js';

export function buildRagSubgraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    .addNode('rewriteQuery', rewriteQuery)
    .addNode('vectorSearch', vectorSearch)
    .addNode('generateResponse', generateRagResponse)
    .addEdge(START, 'rewriteQuery')
    .addEdge('rewriteQuery', 'vectorSearch')
    .addEdge('vectorSearch', 'generateResponse')
    .addEdge('generateResponse', END);

  return graph.compile();
}
