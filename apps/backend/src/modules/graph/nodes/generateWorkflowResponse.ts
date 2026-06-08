import { SystemMessage } from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { State } from '../state.js';
import { createLlm } from '../utils/llm';

const llm = createLlm();

function buildSystemPrompt(state: typeof State.State): string {
  const { behaviour, activeWorkflow, actionResults } = state;

  const parts: string[] = [];

  if (behaviour) {
    parts.push(`${behaviour.systemPrompt}

Response tone: ${behaviour.tone}
Response verbosity: ${behaviour.verbosity}

Fallback message:
"${behaviour.fallbackMessage}"`);

    if (behaviour.guardrails) {
      parts.push(`Restrictions:\n${behaviour.guardrails}`);
    }
  } else {
    parts.push('You are a helpful assistant.');
  }

  if (activeWorkflow) {
    parts.push(`You just completed the "${activeWorkflow.name}" workflow.`);
  }

  const resultEntries = Object.entries(actionResults ?? {});
  if (resultEntries.length > 0) {
    // Find the matching action by id so we can include its type and successMessage.
    const actionMap = Object.fromEntries(
      (activeWorkflow?.actions ?? []).map((a) => [a.id, a]),
    );

    const summary = resultEntries
      .map(([id, r]) => {
        const action = actionMap[id];
        const label = action?.actionType ?? id;

        if (r.success) {
          // Prefer the configured successMessage over a raw JSON dump.
          const successMessage =
            action &&
            'successMessage' in action.config &&
            action.config.successMessage
              ? action.config.successMessage
              : undefined;

          return successMessage
            ? `${label}: ${successMessage}`
            : `${label}: succeeded`;
        }

        return `${label}: failed — ${r.error}`;
      })
      .join('\n');

    parts.push(`Action results:\n${summary}`);
  }

  parts.push(
    'Summarize the outcome naturally to the user. If a successMessage is provided, use it verbatim as the core of your reply. If any action failed, acknowledge it and suggest next steps. Be concise.',
  );

  return parts.join('\n\n');
}

export const generateWorkflowResponse: GraphNode<typeof State> = async (
  state,
) => {
  const systemPrompt = buildSystemPrompt(state);

  // state.messages already contains the full conversation including the last
  // user message — do not append it again as a separate HumanMessage.
  const result = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages.slice(-10),
  ]);

  return { messages: [result] };
};
