import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { LLMResult } from '@langchain/core/outputs';
import { AiCostEventService } from '../../admin/costEvent.service';

export interface CostContext {
  orgId: string;
  agentId?: string;
  conversationId?: string;
  /** Identifies which graph node triggered the call — stored in metadata. */
  nodeName?: string;
  /**
   * Model name fallback. The LangChain factory functions stamp this
   * automatically so callers don't need to set it manually.
   */
  modelName?: string;
}

export class CostTrackingHandler extends BaseCallbackHandler {
  name = 'CostTrackingHandler';

  constructor(private readonly ctx: CostContext) {
    super();
  }

  override async handleLLMEnd(output: LLMResult): Promise<void> {
    const { orgId, agentId, conversationId, nodeName, modelName } = this.ctx;
    if (!orgId) return;

    const llmOutput = output.llmOutput ?? {};

    // Non-streaming uses `tokenUsage`; streaming uses `estimatedTokenUsage`
    const tokenUsage =
      llmOutput.tokenUsage ?? llmOutput.estimatedTokenUsage ?? {};

    // Model name is not in llmOutput — rely on the stamped value from the factory
    const model: string = modelName ?? 'unknown';

    const inputTokens: number = tokenUsage.promptTokens ?? 0;
    const outputTokens: number = tokenUsage.completionTokens ?? 0;
    const totalTokens: number = tokenUsage.totalTokens ?? 0;

    // Skip if the response carried no usage data
    if (!inputTokens && !outputTokens) return;

    void AiCostEventService.recordEvent({
      orgId,
      agentId,
      conversationId,
      provider: 'openai',
      model,
      usage: { inputTokens, outputTokens, totalTokens },
      metadata: { nodeName },
    }).catch(() => {
      // fire-and-forget — never let cost tracking crash the pipeline
    });
  }
}

/**
 * Returns a LangChain callback handler that records an `aiCostEvent` row
 * after every LLM call. Prefer calling this via the factory wrappers in
 * `llm.ts` (e.g. `createNanoLlm(costCtx)`) so the model name is stamped
 * automatically.
 */
export function createCostCallback(ctx: CostContext): CostTrackingHandler {
  return new CostTrackingHandler(ctx);
}
