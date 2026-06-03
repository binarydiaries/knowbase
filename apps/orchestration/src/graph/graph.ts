import * as console from 'node:console';
import { END, type GraphNode, START, StateGraph } from '@langchain/langgraph';
import { ConfigSchema, InputState, OutputState, State } from './state.js';

const callModel: GraphNode<typeof State> = async (state, config) => {
  console.log('agentId', config?.configurable?.agentId);
  return {
    messages: [{ role: 'assistant', content: 'Hi there! How are you?' }],
  };
};

export const builder = new StateGraph({
  input: InputState,
  output: OutputState,
  state: State,
  context: ConfigSchema,
})
  .addNode('callModel', callModel)
  .addEdge(START, 'callModel')
  .addEdge('callModel', END);
