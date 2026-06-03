import type { State } from '../graph/state.js';

export function getLastUserMessage(state: typeof State.State): string {
  const lastMsg = [...state.messages]
    .reverse()
    .find((m) => m.getType() === 'human');
  return typeof lastMsg?.content === 'string' ? lastMsg.content : '';
}
