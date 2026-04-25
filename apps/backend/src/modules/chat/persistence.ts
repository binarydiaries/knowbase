/**
 * Shared persistence helpers for chat turns.
 *
 * Extracted to eliminate the duplicate lead-capture handler and message-save
 * blocks that previously appeared in both `send()` and `sendWhatsApp()`.
 */

import { addEmailJob } from '../../queue/email/email.queue';
import { LeadService } from '../lead/service';
import { MessageService } from '../message/service';
import { SubscriptionService } from '../subscription/service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a single chunk returned by IndexingService.findRelevantContent. */
export interface SearchChunk {
  similarity: number;
  content: string;
  documentId: string;
  documentVersion: number;
  chunkIndex: number;
}

export type Sentiment = {
  label: 'positive' | 'neutral' | 'negative';
  score: number;
} | null;

/** Minimal shape expected from the AI SDK tool-call list. */
interface ToolCall {
  toolName: string;
  input: unknown;
}

// ---------------------------------------------------------------------------
// Lead capture
// ---------------------------------------------------------------------------

/**
 * Iterates over AI SDK tool calls and persists a lead record for every
 * `capture_lead` invocation.  Errors are swallowed — lead capture must never
 * break the conversation.
 */
export async function handleLeadCapture(
  toolCalls: ToolCall[],
  ctx: {
    agentId: string;
    conversationId: string;
    channelId: string;
    orgId: string;
  },
) {
  // Skip lead capture entirely for free plan — best-effort, never break chat
  try {
    const plan = await SubscriptionService.getPlan(ctx.orgId);
    if (!SubscriptionService.planHasLeadGeneration(plan)) return;
  } catch {
    return;
  }

  for (const toolCall of toolCalls) {
    if (toolCall.toolName !== 'capture_lead') continue;

    try {
      const input = toolCall.input as {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
      };
      const lead = await LeadService.create({
        agentId: ctx.agentId,
        conversationId: ctx.conversationId,
        channelId: ctx.channelId,
        orgId: ctx.orgId,
        name: input.name ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        company: input.company ?? null,
      });
      await addEmailJob({
        type: 'lead-notification',
        leadId: lead.id,
        agentId: ctx.agentId,
        orgId: ctx.orgId,
      }).catch(() => {});
    } catch {
      // Best-effort — never break the chat
    }
  }
}

// ---------------------------------------------------------------------------
// Confidence score
// ---------------------------------------------------------------------------

export function computeConfidenceScore(chunks: SearchChunk[]): number {
  if (!chunks.length) return 0;
  return chunks.reduce((acc, c) => acc + c.similarity, 0) / chunks.length;
}

// ---------------------------------------------------------------------------
// Message persistence
// ---------------------------------------------------------------------------

/**
 * Saves the user + assistant message pair to the database.
 * Always call this after the conversation record has been created/updated.
 */
export async function persistMessages({
  conversationId,
  userMessage,
  assistantMessage,
  finalQuery,
  chunks,
  sentiment,
}: {
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  finalQuery: string;
  chunks: SearchChunk[];
  sentiment: Sentiment;
}) {
  await MessageService.addMessages([
    {
      conversationId,
      role: 'user',
      content: userMessage,
      systemMetadata: { finalQuery },
    },
    {
      conversationId,
      role: 'assistant',
      content: assistantMessage,
      metadata: {
        confidenceScore: computeConfidenceScore(chunks),
        sources: chunks.map((c) => ({
          documentId: c.documentId,
          documentVersion: c.documentVersion,
          chunkIndex: c.chunkIndex,
          similarity: c.similarity,
        })),
        sentiment,
      },
    },
  ]);
}
