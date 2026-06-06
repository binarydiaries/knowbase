import { END, START, StateGraph } from '@langchain/langgraph';
import { ConfigSchema } from './config';
import { loadAgent } from './nodes/loadAgent';
import { InputState, OutputState, State } from './state';
import { ragGraph } from './subGraphs/ragGraph';

const builder = new StateGraph({
  input: InputState,
  output: OutputState,
  state: State,
  context: ConfigSchema,
})
  // Nodes
  .addNode('loadAgent', loadAgent)
  .addNode('ragGraph', ragGraph)

  // Edges
  .addEdge(START, 'loadAgent')
  .addEdge('loadAgent', 'ragGraph')
  .addEdge('ragGraph', END);

const graph = builder.compile();
graph.name = 'Agenvik Chat Graph';
export { graph };
