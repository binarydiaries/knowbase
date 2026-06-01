import { buildParentGraph } from '../graph/parent/index.js';

const parentGraph = buildParentGraph();

/**
 * Compiled LangGraph agent graph.
 *
 * Exposed as `graph` so the LangGraph server (langgraph.json) can serve it.
 * Thread ID = conversationId, enabling persistent state across turns.
 */
export const graph = parentGraph.compile();

graph.name = 'Agenvik Chat Agent';
