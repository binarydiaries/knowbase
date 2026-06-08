import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';
import { createLlm } from '../utils/llm';
import { getLastUserMessage } from '../utils/messages';

const llm = createLlm();

function buildSystemPrompt(state: typeof State.State): string {
  const behaviour = state.behaviour;
  if (!behaviour) return 'You are a helpful assistant.';

  const parts: string[] = [];
  parts.push(`${behaviour.systemPrompt}

Response tone: ${behaviour.tone}
Response verbosity: ${behaviour.verbosity}

Fallback message:
"${behaviour.fallbackMessage}"`);

  if (behaviour.guardrails) {
    parts.push(`Restrictions:\n${behaviour.guardrails}`);
  }

  const workflow = state.activeWorkflow;
  if (workflow)
    parts.push(`You just completed the "${workflow.name}" workflow.`);

  const results = Object.entries(state.actionResults);
  if (results.length > 0) {
    const summary = results
      .map(
        ([id, r]) =>
          `Action ${id}: ${r.success ? JSON.stringify(r.data) : `Failed: ${r.error}`}`,
      )
      .join('\n');
    parts.push(`Action results:\n${summary}`);
  }
  parts.push(
    'Summarize the outcome naturally. If any action failed, acknowledge it and suggest next steps. Keep straight to the point, Dont add anything else',
  );

  return parts.join('\n\n');
}

export const generateWorkflowResponse: GraphNode<typeof State> = async (
  state,
) => {
  const systemPrompt = buildSystemPrompt(state);
  const query = state.finalQuery ?? getLastUserMessage(state);

  const result = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages.slice(-10),
    new HumanMessage(query),
  ]);
  return { messages: [result] };
};
