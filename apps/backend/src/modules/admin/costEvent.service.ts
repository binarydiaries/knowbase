import { db } from '../../db';
import { aiCostEvents } from '../../db/schema/aiCostEvents';

type UsageLike = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
};

type Pricing = {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
};

const DEFAULT_PRICING: Record<string, Pricing> = {
  'gpt-4.1-mini': {
    inputPer1M: 0.4,
    outputPer1M: 1.6,
    cachedInputPer1M: 0.1,
  },
  'gpt-4.1-nano': {
    inputPer1M: 0.1,
    outputPer1M: 0.4,
    cachedInputPer1M: 0.025,
  },
  'text-embedding-3-small': {
    inputPer1M: 0.02,
    outputPer1M: 0,
  },
};

function normalizeModel(model: string) {
  return model.includes('/') ? (model.split('/').at(-1) ?? model) : model;
}

function parsePricingMap() {
  const raw = process.env.AI_MODEL_PRICING_JSON;

  if (!raw) {
    return DEFAULT_PRICING;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Pricing>;
    return { ...DEFAULT_PRICING, ...parsed };
  } catch {
    return DEFAULT_PRICING;
  }
}

function roundCurrency(value: number) {
  return Number(value.toFixed(6));
}

function toSafeInt(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

export abstract class AiCostEventService {
  static getPricing(model: string) {
    const normalizedModel = normalizeModel(model);
    const pricingMap = parsePricingMap();

    return {
      pricing: pricingMap[normalizedModel],
      normalizedModel,
    };
  }

  static computeCostUsd(model: string, usage: UsageLike) {
    const { pricing, normalizedModel } = AiCostEventService.getPricing(model);
    const inputTokens = toSafeInt(usage.inputTokens);
    const outputTokens = toSafeInt(usage.outputTokens);
    const cachedInputTokens = toSafeInt(usage.cachedInputTokens);
    const totalTokens =
      toSafeInt(usage.totalTokens) || inputTokens + outputTokens;

    if (!pricing) {
      return {
        normalizedModel,
        inputTokens,
        outputTokens,
        cachedInputTokens,
        totalTokens,
        costUsd: 0,
      };
    }

    const costUsd =
      (inputTokens / 1_000_000) * pricing.inputPer1M +
      (outputTokens / 1_000_000) * pricing.outputPer1M +
      (cachedInputTokens / 1_000_000) *
        (pricing.cachedInputPer1M ?? pricing.inputPer1M);

    return {
      normalizedModel,
      inputTokens,
      outputTokens,
      cachedInputTokens,
      totalTokens,
      costUsd: roundCurrency(costUsd),
    };
  }

  static async recordEvent({
    orgId,
    agentId,
    conversationId,
    provider,
    model,
    usage,
    metadata,
  }: {
    orgId: string;
    agentId?: string;
    conversationId?: string;
    provider: string;
    model: string;
    usage: UsageLike;
    metadata?: Record<string, unknown>;
  }) {
    const parsed = AiCostEventService.computeCostUsd(model, usage);

    await db.insert(aiCostEvents).values({
      orgId,
      agentId,
      conversationId,
      provider,
      model: parsed.normalizedModel,
      inputTokens: parsed.inputTokens,
      outputTokens: parsed.outputTokens,
      cachedInputTokens: parsed.cachedInputTokens,
      totalTokens: parsed.totalTokens,
      costUsd: parsed.costUsd.toFixed(6),
      metadata: metadata
        ? { ...metadata, rawModel: model }
        : { rawModel: model },
    });

    return parsed;
  }
}
