import type { RunnableConfig } from '@langchain/core/runnables';
import type { IInternalState, IInternalUpdate } from '../state.js';

export async function loadAgent(
  _state: IInternalState,
  _config: RunnableConfig,
): Promise<IInternalUpdate> {
  // TODO: load agent config + workflows from DB using config.configurable.agentId
  return {};
}
