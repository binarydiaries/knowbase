import { END, START, StateGraph } from '@langchain/langgraph';
import { ConfigSchema } from './config';
import { detectIntent, INTENT_QUESTION_ANSWERING } from './nodes/detectIntent';
import { extractEntities } from './nodes/extractEntities';
import { loadAgent } from './nodes/loadAgent';
import { InputState, OutputState, State } from './state';
import { ragGraph } from './subGraphs/ragGraph';
import { workflowGraph } from './subGraphs/workflowGraph';
import { checkpointer } from './utils/checkpointer';

const routeByIntent = (
  state: typeof State.State,
): 'ragGraph' | 'workflowGraph' =>
  state.intent === INTENT_QUESTION_ANSWERING ? 'ragGraph' : 'workflowGraph';

const builder = new StateGraph({
  input: InputState,
  output: OutputState,
  state: State,
  context: ConfigSchema,
})
  // Nodes
  .addNode('loadAgent', loadAgent)
  .addNode('extractEntities', extractEntities)
  .addNode('detectIntent', detectIntent)
  .addNode('ragGraph', ragGraph)
  .addNode('workflowGraph', workflowGraph)

  // Conditional
  .addConditionalEdges('detectIntent', routeByIntent, {
    ragGraph: 'ragGraph',
    workflowGraph: 'workflowGraph',
  })

  // Edges
  .addEdge(START, 'loadAgent')
  .addEdge('loadAgent', 'extractEntities')
  .addEdge('extractEntities', 'detectIntent')
  .addEdge('ragGraph', END)
  .addEdge('workflowGraph', END);

const graph = builder.compile({ checkpointer });
graph.name = 'Agenvik Chat Graph';
export { graph };
