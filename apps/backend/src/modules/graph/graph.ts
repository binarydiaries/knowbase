import { END, START, StateGraph } from '@langchain/langgraph';
import { ConfigSchema } from './config';
import { detectIntent, INTENT_QUESTION_ANSWERING } from './nodes/detectIntent';
import { extractEntities } from './nodes/extractEntities';
import { enrichConversation } from './nodes/enrichConversation';
import { initConversation } from './nodes/initConversation';
import { loadAgent } from './nodes/loadAgent';
import { persistTurn } from './nodes/persistTurn';
import { InputState, OutputState, State } from './state';
import { ragGraph } from './subGraphs/ragGraph';
import { workflowGraph } from './subGraphs/workflowGraph';
import { checkpointer } from './utils/checkpointer';

const routeByIntent = (
  state: typeof State.State,
): 'ragGraph' | 'workflowGraph' => {
  if (state.intent === INTENT_QUESTION_ANSWERING) return 'ragGraph';
  // Guard: if the detected intent doesn't map to a loaded workflow (e.g. the
  // LLM emitted a stale value or the workflow was deleted mid-conversation),
  // fall through to RAG rather than entering workflowGraph and producing a
  // silent empty response.
  const hasMatchingWorkflow = state.workflows.some(
    (w) => w.intentName === state.intent,
  );
  return hasMatchingWorkflow ? 'workflowGraph' : 'ragGraph';
};

const builder = new StateGraph({
  input: InputState,
  output: OutputState,
  state: State,
  context: ConfigSchema,
})
  // Nodes
  .addNode('initConversation', initConversation)
  .addNode('loadAgent', loadAgent)
  .addNode('extractEntities', extractEntities)
  .addNode('detectIntent', detectIntent)
  .addNode('ragGraph', ragGraph)
  .addNode('workflowGraph', workflowGraph)
  .addNode('persistTurn', persistTurn)
  .addNode('enrichConversation', enrichConversation)

  // Conditional
  .addConditionalEdges('detectIntent', routeByIntent, {
    ragGraph: 'ragGraph',
    workflowGraph: 'workflowGraph',
  })

  // Edges
  .addEdge(START, 'initConversation')
  .addEdge('initConversation', 'loadAgent')
  .addEdge('loadAgent', 'extractEntities')
  .addEdge('extractEntities', 'detectIntent')
  .addEdge('ragGraph', 'persistTurn')
  .addEdge('ragGraph', 'enrichConversation')
  .addEdge('workflowGraph', 'persistTurn')
  .addEdge('workflowGraph', 'enrichConversation')
  .addEdge('persistTurn', END)
  .addEdge('enrichConversation', END);

const graph = builder.compile({ checkpointer });
graph.name = 'Agenvik Chat Graph';
export { graph };
