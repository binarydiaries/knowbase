import { AIMessage } from '@langchain/core/messages';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  aiCostEvents,
  conversations,
  messages,
  orgUsageMonthly,
} from '../../db/schema.js';
import { computeConfidenceScore } from '../../rag/retrieval.js';
import type { AgentState, AgentStateUpdate } from '../state.js';

// ── Sentiment scoring ─────────────────────────────────────────────────────────

import { createNanoLlm } from '../../integrations/llm.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const nanoLlm = createNanoLlm();

async function scoreSentiment(text: string): Promise<{ label: 'positive' | 'neutral' | 'negative'; score: number } | null> {
  try {
    const result = await nanoLlm.invoke([
      new SystemMessage('Classify the sentiment of this AI assistant response as positive, neutral, or negative, and give a confidence score between 0 and 1. Respond with JSON only: {"label":"positive|neutral|negative","score":0.0}'),
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

// ── Topic enrichment ──────────────────────────────────────────────────────────

async function detectTopic(firstUserMessage: string): Promise<string | null> {
  try {
    const result = await nanoLlm.invoke([
      new HumanMessage(`In 2-5 words, what topic is this question about? Reply with ONLY the topic label, nothing else.\n\n"${firstUserMessage}"`),
    ]);
    const raw = typeof result.content === 'string' ? result.content.trim() : '';
    return raw.replace(/^["']|["']$/g, '') || null;
  } catch {
    return null;
  }
}

// ── Geo enrichment ────────────────────────────────────────────────────────────

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

// ── Plan check (simplified: org_subscriptions) ────────────────────────────────

async function isFreePlan(orgId: string): Promise<boolean> {
  try {
    const rows = await db
      .select({ plan: sql<string>`plan` })
      .from(sql`org_subscriptions`)
      .where(sql`org_id = ${orgId}`)
      .limit(1);
    return (rows[0] as { plan?: string })?.plan === 'free';
  } catch {
    return true; // default to free on error
  }
}

// ── Main persistTurn node ─────────────────────────────────────────────────────

export async function persistTurn(state: AgentState): Promise<AgentStateUpdate> {
  const {
    conversationId,
    agentId,
    channelId,
    orgId,
    userMessage,
    finalQuery,
    response,
    ragChunks,
    entities,
    ip,
  } = state;

  if (!response) return {};

  const now = new Date();
  const free = await isFreePlan(orgId);

  // ── Sentiment (paid plans only) ───────────────────────────────────────────
  const sentiment = !free ? await scoreSentiment(response) : null;

  // ── Conversation upsert ───────────────────────────────────────────────────
  const existingConversation = await db
    .select({ id: conversations.id, createdAt: conversations.createdAt })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)
    .then((rows) => rows[0]);

  const isNew = !existingConversation;

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
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await db
    .insert(orgUsageMonthly)
    .values({ id: createId(), orgId, year, month, assistantMessages: 1 })
    .onConflictDoUpdate({
      target: [orgUsageMonthly.orgId, orgUsageMonthly.year, orgUsageMonthly.month],
      set: { assistantMessages: sql`${orgUsageMonthly.assistantMessages} + 1` },
    })
    .catch(() => {});

  // ── Fire-and-forget enrichment (new conversations, paid plans) ────────────
  if (isNew && !free) {
    void (async () => {
      const [country, topic] = await Promise.allSettled([
        lookupCountry(ip),
        detectTopic(userMessage),
      ]);
      const updates: Record<string, unknown> = {};
      if (country.status === 'fulfilled' && country.value) updates.country = country.value;
      if (topic.status === 'fulfilled' && topic.value) updates.topic = topic.value;
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
