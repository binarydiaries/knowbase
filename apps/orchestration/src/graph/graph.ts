import { END, START, StateGraph } from '@langchain/langgraph';
import { detectIntent } from './nodes/detectIntent.js';
import { extractEntities } from './nodes/extractEntities.js';
import { loadAgent } from './nodes/loadAgent.js';
import { ConfigSchema, InputState, OutputState, State } from './state.js';

export const builder = new StateGraph({
  input: InputState,
  output: OutputState,
  state: State,
  context: ConfigSchema,
})
  .addNode('loadAgent', loadAgent)
  .addNode('extractEntities', extractEntities)
  .addNode('detectIntent', detectIntent)
  .addEdge(START, 'loadAgent')
  .addEdge('loadAgent', 'extractEntities')
  .addEdge('extractEntities', 'detectIntent')
  .addEdge('detectIntent', END);
