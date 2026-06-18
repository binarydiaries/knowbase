import type { GraphNode } from '@langchain/langgraph';
import { ConversationService } from '../../conversation/service';
import { getLastUserMessage } from '../utils/messages';
import type { State } from '../state';

export const initConversation: GraphNode<typeof State> = async (state, config) => {
  const { thread_id, agentId, channelId } = config?.configurable ?? {};

  if (!thread_id || !agentId || !channelId) return {};

  const userMessage = getLastUserMessage(state);

  const isNew = state.messages.length === 1;

  if (isNew) {
    await ConversationService.create({
      id: thread_id,
      agentId,
      channelId,
      lastUserQuestion: userMessage,
      lastAssistantUtterance: '',
      lastMessageAt: new Date(),
    });
  } else {
    await ConversationService.update(thread_id, {
      lastUserQuestion: userMessage,
      lastMessageAt: new Date(),
    });
  }

  return {};
};
