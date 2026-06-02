import { END, START, StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { AgentStateAnnotation, InputAnnotation } from '../state.js';
import { loadAgent } from '../nodes/load-agent.js';
import { extractEntities } from '../nodes/extract-entities.js';
import { detectIntent, INTENT_QUESTION_ANSWERING } from '../nodes/detect-intent.js';
import { persistTurn } from '../nodes/persist-turn.js';
import { buildRagSubgraph } from '../subgraphs/rag/index.js';
import { buildWorkflowSubgraph } from '../subgraphs/workflow/index.js';
import type { AgentState } from '../state.js';

/**
 * Configuration schema — exposed to LangGraph Studio and LangSmith.
 * These fields go in the "Configurable" panel when running the graph manually.
 * thread_id is built-in to LangGraph (= conversationId) — no need to define it here.
 */
export const GraphConfigSchema = z.object({
  agentId: z.string().describe('Agent ID from the dashboard'),
  orgId: z.string().describe('Clerk organisation ID'),
  channelId: z.string().describe('Channel ID the message came from'),
  ip: z.string().optional().describe('Client IP address (for geo enrichment, optional)'),
});

function routeByIntent(state: AgentState): 'ragSubgraph' | 'workflowSubgraph' {
  return state.intent === INTENT_QUESTION_ANSWERING || !state.intent
    ? 'ragSubgraph'
    : 'workflowSubgraph';
}

export function buildParentGraph() {
  const ragSubgraph = buildRagSubgraph();
  const workflowSubgraph = buildWorkflowSubgraph();

  // Unified init object:
  //  - `input`   → tells Studio the required input is just { messages }
  //  - `state`   → full internal state annotation
  //  - `context` → configurable schema shown in the Studio "Configurable" panel
  const graph = new StateGraph({
    input: InputAnnotation,
    state: AgentStateAnnotation,
    context: GraphConfigSchema,
  })
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
