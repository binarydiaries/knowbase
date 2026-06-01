import { END, START, StateGraph } from '@langchain/langgraph';
import { AgentStateAnnotation } from '../state.js';
import { loadAgent } from '../nodes/load-agent.js';
import { extractEntities } from '../nodes/extract-entities.js';
import { detectIntent, INTENT_QUESTION_ANSWERING } from '../nodes/detect-intent.js';
import { persistTurn } from '../nodes/persist-turn.js';
import { buildRagSubgraph } from '../subgraphs/rag/index.js';
import { buildWorkflowSubgraph } from '../subgraphs/workflow/index.js';
import type { AgentState } from '../state.js';

function routeByIntent(state: AgentState): 'ragSubgraph' | 'workflowSubgraph' {
  return state.intent === INTENT_QUESTION_ANSWERING || !state.intent
    ? 'ragSubgraph'
    : 'workflowSubgraph';
}

export function buildParentGraph() {
  const ragSubgraph = buildRagSubgraph();
  const workflowSubgraph = buildWorkflowSubgraph();

  const graph = new StateGraph(AgentStateAnnotation)
    .addNode('loadAgent', loadAgent)
    .addNode('extractEntities', extractEntities)
    .addNode('detectIntent', detectIntent)
    .addNode('ragSubgraph', ragSubgraph)
    .addNode('workflowSubgraph', workflowSubgraph)
    .addNode('persistTurn', persistTurn)
    .addEdge(START, 'loadAgent')
    .addEdge('loadAgent', 'extractEntities')
    .addEdge('extractEntities', 'detectIntent')
    .addConditionalEdges('detectIntent', routeByIntent, {
      ragSubgraph: 'ragSubgraph',
      workflowSubgraph: 'workflowSubgraph',
    })
    .addEdge('ragSubgraph', 'persistTurn')
    .addEdge('workflowSubgraph', 'persistTurn')
    .addEdge('persistTurn', END);

  return graph;
}
