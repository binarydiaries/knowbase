import type { GraphNode } from '@langchain/langgraph';
import { ConversationService } from '../../conversation/service';
import type { State } from '../state';
import { getLastUserMessage } from '../utils/messages';

export const initConversation: GraphNode<typeof State> = async (
  state,
  config,
) => {
  const { thread_id, orgId, agentId, channelId } = config?.configurable ?? {};

  if (!thread_id || !orgId || !agentId || !channelId) return {};

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
    await ConversationService.update(
      { id: thread_id, orgId, agentId, channelId },
      {
        lastUserQuestion: userMessage,
        lastMessageAt: new Date(),
      },
    );
  }

  return {};
};
