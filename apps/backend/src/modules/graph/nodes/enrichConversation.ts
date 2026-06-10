import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { GraphNode } from '@langchain/langgraph';
import { z } from 'zod';
import { ConversationService } from '../../conversation/service';
import { createNanoLlm } from '../utils/llm';
import { getLastUserMessage } from '../utils/messages';
import type { State } from '../state';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TopicSchema = z.object({
  topic: z.string().describe('2-5 word topic label for the conversation'),
});

async function lookupCountry(ip: string): Promise<string | null> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    if (!res.ok) return null;
    const geo = (await res.json()) as { countryCode?: string };
    return geo.countryCode ?? null;
  } catch {
    return null;
  }
}

async function labelTopic(
  firstUserMessage: string,
  config?: RunnableConfig | null,
): Promise<string | null> {
  try {
    const topicLlm = createNanoLlm(config, 'enrichConversation').withStructuredOutput(
      TopicSchema,
      { name: 'label_topic', strict: true },
    );
    const { topic } = await topicLlm.invoke([
      new SystemMessage('In 2-5 words, what topic is this question about?'),
      new HumanMessage(`"${firstUserMessage}"`),
    ]);
    return topic.trim() || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Node
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget enrichment — runs in parallel with persistTurn.
 * Attaches country (via IP geo) and topic label (via nano LLM) to the conversation.
 * Only meaningful on the first turn; both lookups are best-effort.
 */
export const enrichConversation: GraphNode<typeof State> = async (state, config) => {
  const { thread_id, ip, isPaid } = config?.configurable ?? {};

  if (!thread_id || !isPaid) return {};

  // New conversation = first HumanMessage + first AIMessage (length 2)
  const isNew = state.messages.length === 2;

  void (async () => {
    try {
      const updates: Record<string, string> = {};

      if (ip && ip !== '127.0.0.1' && ip !== '::1') {
        const country = await lookupCountry(ip);
        if (country) updates.country = country;
      }

      if (isNew) {
        const topic = await labelTopic(getLastUserMessage(state), config);
        if (topic) updates.topic = topic;
      }

      if (Object.keys(updates).length) {
        await ConversationService.update(thread_id, updates);
      }
    } catch {
      // Enrichment is always best-effort — never break the conversation
    }
  })();

  return {};
};
