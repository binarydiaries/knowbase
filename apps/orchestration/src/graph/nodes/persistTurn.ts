import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { GraphNode } from '@langchain/langgraph';
import { eq } from 'drizzle-orm';
import { conversations, db, messages } from '@knowbase/models/db';
import { getLastAssistantMessage, getLastUserMessage } from '../../utils/messages.js';
import type { State } from '../state.js';

export const persistTurn: GraphNode<typeof State> = async (state, config) => {
  const conversationId = (config as LangGraphRunnableConfig)?.configurable
    ?.thread_id as string | undefined;

  if (!conversationId) return {};

  const userText = getLastUserMessage(state);
  const assistantText = getLastAssistantMessage(state);

  if (!userText || !assistantText) return {};

  await db.insert(messages).values([
    { conversationId, role: 'user', content: userText },
    { conversationId, role: 'assistant', content: assistantText },
  ]);

  await db
    .update(conversations)
    .set({
      lastUserQuestion: userText,
      lastAssistantUtterance: assistantText,
      lastMessageAt: new Date(),
      entities: state.entities as Record<string, string>,
    })
    .where(eq(conversations.id, conversationId));

  return {};
};
