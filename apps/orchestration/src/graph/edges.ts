import type { State } from './state.js';

/** Routes after detectIntent — wired in once the workflow subgraph is ready. */
export function intentRouter(_state: typeof State.State): 'general_chat' | 'workflow' {
  // Stub: full routing logic lives with the workflow subgraph.
  return 'general_chat';
}
