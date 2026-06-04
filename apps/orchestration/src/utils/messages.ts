import { AIMessage, HumanMessage } from '@langchain/core/messages';
import type { State } from '../graph/state.js';

export function getLastUserMessage(state: typeof State.State): string {
  const lastMsg = [...state.messages]
    .reverse()
    .find((m) => HumanMessage.isInstance(m));

  if (!lastMsg) return '';

  // Plain string — most common case
  if (typeof lastMsg.content === 'string') return lastMsg.content;

  // Multimodal content blocks array — pick the first text block
  if (Array.isArray(lastMsg.content)) {
    return lastMsg.content.find((cb) => cb.type === 'text')?.text ?? '';
  }

  return '';
}

export function getLastAssistantMessage(state: typeof State.State): string {
  const lastMsg = [...state.messages]
    .reverse()
    .find((m) => AIMessage.isInstance(m));

  if (!lastMsg) return '';

  // Plain string — most common case
  if (typeof lastMsg.content === 'string') return lastMsg.content;

  // Multimodal content blocks array — pick the first text block
  if (Array.isArray(lastMsg.content)) {
    return lastMsg.content.find((cb) => cb.type === 'text')?.text ?? '';
  }

  return '';
}
