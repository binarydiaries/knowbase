import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { conversations, messages, orgSubscriptions, orgUsageMonthly } from '../../db/schema.js';
import { createNanoLlm } from '../../integrations/llm.js';
import { computeConfidenceScore } from '../../rag/retrieval.js';
import { getLastUserMessage } from '../state.js';
import type { AgentState, AgentStateUpdate } from '../state.js';

const nanoLlm = createNanoLlm();

function getUtcMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7); // "YYYY-MM"
}

async function scoreSentiment(
  text: string,
): Promise<{ label: 'positive' | 'neutral' | 'negative'; score: number } | null> {
  try {
    const result = await nanoLlm.invoke([
      new SystemMessage(
        'Classify the sentiment of this AI assistant response as positive, neutral, or negative, and give a confidence score between 0 and 1. Respond with JSON only: {"label":"positive|neutral|negative","score":0.0}',
      ),
      new HumanMessage(`"${text}"`),
    ]);
    const raw = typeof result.content === 'string' ? result.content.trim() : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as { label: 'positive' | 'neutral' | 'negative'; score: number };
  } catch {
    return null;
  }
}

async function detectTopic(message: string): Promise<string | null> {
  try {
    const result = await nanoLlm.invoke([
      new HumanMessage(
        `In 2-5 words, what topic is this question about? Reply with ONLY the topic label, nothing else.\n\n"${message}"`,
      ),
    ]);
    const raw = typeof result.content === 'string' ? result.content.trim() : '';
    return raw.replace(/^["']|["']$/g, '') || null;
  } catch {
    return null;
  }
}

async function lookupCountry(ip: string | undefined): Promise<string | null> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return null;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    if (!res.ok) return null;
    const geo = (await res.json()) as { countryCode?: string };
    return geo.countryCode ?? null;
  } catch {
    return null;
  }
}

async function isFreePlan(orgId: string): Promise<boolean> {
  try {
    const row = await db
      .select({ status: orgSubscriptions.status })
      .from(orgSubscriptions)
      .where(eq(orgSubscriptions.orgId, orgId))
      .limit(1)
      .then((rows) => rows[0]);
    return row?.status !== 'active';
  } catch {
    return true;
  }
}

export async function persistTurn(state: AgentState, config: RunnableConfig): Promise<AgentStateUpdate> {
  // thread_id is LangGraph's built-in key — it IS the conversationId
  const conversationId = config.configurable?.thread_id as string;
  const agentId = config.configurable?.agentId as string;
  const channelId = config.configurable?.channelId as string;
  const orgId = config.configurable?.orgId as string;
  const ip = config.configurable?.ip as string | undefined;

  const { response, ragChunks, entities, finalQuery } = state;
  const userMessage = getLastUserMessage(state);

  if (!response || !conversationId || !agentId || !orgId) return {};

  const now = new Date();
  const free = await isFreePlan(orgId);
  const sentiment = !free ? await scoreSentiment(response) : null;

  // ── Conversation upsert ───────────────────────────────────────────────────
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)
    .then((rows) => rows[0]);

  const isNew = !existing;

  if (isNew) {
    await db.insert(conversations).values({
      id: conversationId,
      agentId,
      channelId,
      lastUserQuestion: userMessage,
      lastAssistantUtterance: response,
      lastMessageAt: now,
      entities: entities as Record<string, string>,
    });
  } else {
    await db
      .update(conversations)
      .set({
        lastUserQuestion: userMessage,
        lastAssistantUtterance: response,
        lastMessageAt: now,
        entities: entities as Record<string, string>,
        updatedAt: now,
      })
      .where(eq(conversations.id, conversationId));
  }

  // ── Messages ──────────────────────────────────────────────────────────────
  const confidenceScore = computeConfidenceScore(ragChunks);
  const sources = ragChunks.map((c) => ({
    documentId: c.documentId,
    documentVersion: c.documentVersion,
    chunkIndex: c.chunkIndex,
    similarity: c.similarity,
  }));

  await db.insert(messages).values([
    {
      id: createId(),
      conversationId,
      role: 'user',
      content: userMessage,
      systemMetadata: { finalQuery: finalQuery ?? userMessage },
    },
    {
      id: createId(),
      conversationId,
      role: 'assistant',
      content: response,
      metadata: {
        confidenceScore,
        sources: sources.length > 0 ? sources : null,
        sentiment,
      },
    },
  ]);

  // ── Usage tracking ────────────────────────────────────────────────────────
  const monthKey = getUtcMonthKey(now);
  await db
    .insert(orgUsageMonthly)
    .values({ id: createId(), orgId, monthKey, assistantMessages: 0 })
    .onConflictDoNothing();
  await db
    .update(orgUsageMonthly)
    .set({ assistantMessages: sql`${orgUsageMonthly.assistantMessages} + 1`, updatedAt: now })
    .where(and(eq(orgUsageMonthly.orgId, orgId), eq(orgUsageMonthly.monthKey, monthKey)));

  // ── Fire-and-forget enrichment (new conversations, paid plans only) ────────
  if (isNew && !free) {
    void (async () => {
      const [countryResult, topicResult] = await Promise.allSettled([
        lookupCountry(ip),
        detectTopic(userMessage),
      ]);
      const updates: Record<string, unknown> = {};
      if (countryResult.status === 'fulfilled' && countryResult.value) updates.country = countryResult.value;
      if (topicResult.status === 'fulfilled' && topicResult.value) updates.topic = topicResult.value;
      if (Object.keys(updates).length > 0) {
        await db
          .update(conversations)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(conversations.id, conversationId))
          .catch(() => {});
      }
    })();
  }

  return {};
}
