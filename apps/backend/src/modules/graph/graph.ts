import { END, START, StateGraph } from '@langchain/langgraph';
import { ConfigSchema } from './config';
import { detectIntent, INTENT_QUESTION_ANSWERING } from './nodes/detectIntent';
import { enrichConversation } from './nodes/enrichConversation';
import { extractEntities } from './nodes/extractEntities';
import { initConversation } from './nodes/initConversation';
import { loadAgent } from './nodes/loadAgent';
import { persistTurn } from './nodes/persistTurn';
import { InputState, OutputState, State } from './state';
import { intentGraph } from './subGraphs/intentGraph';
import { ragGraph } from './subGraphs/ragGraph';
import { checkpointer } from './utils/checkpointer';

const routeByIntent = (
  state: typeof State.State,
): 'ragGraph' | 'intentGraph' => {
  if (state.intent === INTENT_QUESTION_ANSWERING) return 'ragGraph';
  // Guard: if the detected intent doesn't map to a loaded intent config (e.g. the
  // LLM emitted a stale value or the intent was deleted mid-conversation),
  // fall through to RAG rather than entering intentGraph and producing a
  // silent empty response.
  const hasMatchingIntent = state.intents.some((w) => w.name === state.intent);
  return hasMatchingIntent ? 'intentGraph' : 'ragGraph';
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
  .addNode('intentGraph', intentGraph)
  .addNode('persistTurn', persistTurn)
  .addNode('enrichConversation', enrichConversation)

  // Conditional
  .addConditionalEdges('detectIntent', routeByIntent, {
    ragGraph: 'ragGraph',
    intentGraph: 'intentGraph',
  })

  // Edges
  .addEdge(START, 'loadAgent')
  .addEdge('loadAgent', 'initConversation')
  .addEdge('initConversation', 'extractEntities')
  .addEdge('extractEntities', 'detectIntent')
  .addEdge('ragGraph', 'persistTurn')
  .addEdge('ragGraph', 'enrichConversation')
  .addEdge('intentGraph', 'persistTurn')
  .addEdge('intentGraph', 'enrichConversation')
  .addEdge('persistTurn', END)
  .addEdge('enrichConversation', END);

const graph = builder.compile({ checkpointer });
graph.name = 'Agenvik Chat Graph';
export { graph };
