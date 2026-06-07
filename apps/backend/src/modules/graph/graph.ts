import { END, START, StateGraph } from '@langchain/langgraph';
import { ConfigSchema } from './config';
import { detectIntent } from './nodes/detectIntent';
import { extractEntities } from './nodes/extractEntities';
import { loadAgent } from './nodes/loadAgent';
import { InputState, OutputState, State } from './state';
import { ragGraph } from './subGraphs/ragGraph';
import { checkpointer } from './utils/checkpointer';

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

  // Edges
  .addEdge(START, 'loadAgent')
  .addEdge('loadAgent', 'extractEntities')
  .addEdge('extractEntities', 'detectIntent')
  .addEdge('detectIntent', 'ragGraph')
  .addEdge('ragGraph', END);

const graph = builder.compile({ checkpointer });
graph.name = 'Agenvik Chat Graph';
export { graph };
