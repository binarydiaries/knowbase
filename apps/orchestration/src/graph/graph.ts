import type { RunnableConfig } from '@langchain/core/runnables';
import { END, START, StateGraph } from '@langchain/langgraph';
import {
  graphConfigSchema,
  type IInternalState,
  type IInternalUpdate,
  inputStateSchema,
  internalStateSchema,
  outputStateSchema,
} from './state.js';

// Placeholder node — replace with real nodes as you build
const callModel = async (
  _state: IInternalState,
  _config: RunnableConfig,
): Promise<IInternalUpdate> => {
  return {
    messages: [{ role: 'assistant', content: 'Hi there! How are you?' }],
  };
};

export const builder = new StateGraph({
  input: inputStateSchema,
  output: outputStateSchema,
  state: internalStateSchema,
  context: graphConfigSchema,
})
  .addNode('callModel', callModel)
  .addEdge(START, 'callModel')
  .addEdge('callModel', END);
