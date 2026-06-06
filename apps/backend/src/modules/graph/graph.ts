import { END, START, StateGraph } from '@langchain/langgraph';
import { ConfigSchema } from './config';
import { loadAgent } from './nodes/loadAgent';
import { InputState, OutputState, State } from './state';

const builder = new StateGraph({
  input: InputState,
  output: OutputState,
  state: State,
  context: ConfigSchema,
})
  .addNode('loadAgent', loadAgent)
  .addEdge(START, 'loadAgent')
  .addEdge('loadAgent', END);

const graph = builder.compile();
graph.name = 'Agenvik Chat Graph';
export { graph };
