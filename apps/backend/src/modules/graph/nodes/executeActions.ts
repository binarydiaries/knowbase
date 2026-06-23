import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import type { GraphNode } from '@langchain/langgraph';
import type { z } from 'zod';
import type { IntentActionSchema } from '../../intent/model';
import { actionHandlers, type IActionResult } from '../actions';
import { ConfigSchema } from '../config';
import { INTENT_QUESTION_ANSWERING } from '../intents';
import type { State } from '../state';
import { createStreamingNanoLlm } from '../utils/llm';

const DEFAULT_SUCCESS = 'Done! Your request has been submitted.';
const DEFAULT_FAILURE =
  'Something went wrong. Please try again or contact support at hello@agenvik.com.';

/**
 * For api_trigger actions, the result data shape is arbitrary (whatever the
 * customer's API returns), so a static success/failure string can't phrase
 * it naturally. If the action config carries responseInstructions, ask a
 * cheap model to phrase the answer from the actual API response instead.
 */
async function phraseApiTriggerResponse(
  actions: z.infer<typeof IntentActionSchema>[],
  results: Record<string, IActionResult>,
  config?: Record<string, unknown>,
): Promise<string | undefined> {
  const apiAction = actions.find(
    (a) =>
      a.actionType === 'api_trigger' &&
      typeof a.config === 'object' &&
      a.config !== null &&
      'responseInstructions' in a.config &&
      typeof (a.config as { responseInstructions?: unknown })
        .responseInstructions === 'string',
  );
  if (!apiAction) return undefined;

  const result = results[apiAction.id];
  if (!result) return undefined;

  const responseInstructions = (
    apiAction.config as { responseInstructions: string }
  ).responseInstructions;

  const userPrompt = result.success
    ? `Data: ${JSON.stringify(result.data)}\nInstructions: ${responseInstructions}\nAnswer the user naturally in 1-2 sentences based on the data.`
    : `The lookup failed (error: ${result.error ?? 'unknown'}).\nInstructions: ${responseInstructions}\nTell the user the lookup didn't work in 1-2 friendly sentences, without exposing technical details.`;

  try {
    const llmResult = await createStreamingNanoLlm(
      config,
      'executeActions',
    ).invoke([
      new SystemMessage(
        'You are a helpful assistant. Respond with only the final answer, no preamble.',
      ),
      new HumanMessage(userPrompt),
    ]);
    return typeof llmResult.content === 'string'
      ? llmResult.content
      : undefined;
  } catch {
    return undefined;
  }
}

async function executeAction(
  action: z.infer<typeof IntentActionSchema>,
  state: typeof State.State,
  configurable?: Record<string, unknown>,
  previousResults?: Record<string, IActionResult>,
): Promise<IActionResult> {
  const { agentId, orgId, channelId, thread_id } =
    ConfigSchema.parse(configurable);

  if (!agentId || !orgId || !channelId || !thread_id) {
    throw new Error(
      'Missing required configurable: agentId, orgId, channelId, or thread_id',
    );
  }

  const handler = actionHandlers[action.actionType];
  if (!handler) {
    return {
      success: false,
      error: `Unknown action type: ${action.actionType}`,
    };
  }

  try {
    return await handler({
      agentId,
      orgId,
      channelId,
      conversationId: thread_id,
      entities: state.entities as Record<string, string | null>,
      config: action.config,
      previousResults,
    });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const executeActions: GraphNode<typeof State> = async (
  state,
  config,
) => {
  const { activeIntent } = state;
  if (!activeIntent) return {};

  // Intent has no actions configured — still complete it cleanly so the
  // checkpoint doesn't get stuck with a dangling activeIntent.
  if (activeIntent.actions.length === 0) {
    return {
      activeIntent: undefined,
      intent: INTENT_QUESTION_ANSWERING,
      askedOptionalFields: false,
      messages: [
        new AIMessage(activeIntent.config?.success?.trim() || DEFAULT_SUCCESS),
      ],
    };
  }

  const results: Record<string, IActionResult> = {};

  if (activeIntent.executionMode === 'sequential') {
    for (const action of activeIntent.actions) {
      // Pass accumulated results so later actions can reference data
      // produced by earlier ones (e.g. save_lead's leadId).
      results[action.id] = await executeAction(
        action,
        state,
        config.configurable,
        results,
      );
    }
  } else {
    const settled = await Promise.allSettled(
      activeIntent.actions.map((action) =>
        executeAction(action, state, config.configurable),
      ),
    );
    activeIntent.actions.forEach((action, i) => {
      const s = settled[i];
      results[action.id] =
        s.status === 'fulfilled'
          ? s.value
          : {
              success: false,
              error:
                s.reason instanceof Error ? s.reason.message : String(s.reason),
            };
    });
  }

  const succeeded = Object.values(results).every((r) => r.success);
  const intentConfig = activeIntent.config;
  const phrasedMessage = await phraseApiTriggerResponse(
    activeIntent.actions,
    results,
    config.configurable,
  );
  const message =
    phrasedMessage?.trim() ||
    (succeeded
      ? intentConfig?.success?.trim() || DEFAULT_SUCCESS
      : intentConfig?.failure?.trim() || DEFAULT_FAILURE);

  // Intent is done — clear activeIntent and reset intent.
  return {
    activeIntent: undefined,
    intent: INTENT_QUESTION_ANSWERING,
    askedOptionalFields: false,
    messages: [new AIMessage(message)],
  };
};
