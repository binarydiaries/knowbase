import { SystemMessage } from '@langchain/core/messages';
import {
  END,
  type GraphNode,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

const State = new StateSchema({
  messages: MessagesValue,
});

const mockLlm: GraphNode<typeof State> = async (state) => {
  const llm = new ChatOpenAI({
    model: 'gpt-4.1-nano',
    temperature: 0,
  });

  const result = await llm.invoke([
    new SystemMessage(
      'Your joke teller, Whatever user say always make joke and fun of it',
    ),
    ...state.messages,
  ]);
  return {
    messages: [result],
  };
};

const builder = new StateGraph(State)
  .addNode('mock_llm', mockLlm)
  .addEdge(START, 'mock_llm')
  .addEdge('mock_llm', END);

export const graph = builder.compile();

// await graph.invoke({ messages: [{ role: 'user', content: 'hi!' }] });
