import {
  END,
  type GraphNode,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';

const State = new StateSchema({
  messages: MessagesValue,
});

const mockLlm: GraphNode<typeof State> = (state) => {
  return {
    messages: [{ role: 'assistant', content: 'Hi there! How are you?' }],
  };
};

const builder = new StateGraph(State)
  .addNode('mock_llm', mockLlm)
  .addEdge(START, 'mock_llm')
  .addEdge('mock_llm', END);

export const graph = builder.compile();

// await graph.invoke({ messages: [{ role: 'user', content: 'hi!' }] });
