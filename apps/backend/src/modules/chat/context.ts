/**
 * Builds the LLM context (tools, system prompt, prior history) for a chat turn.
 *
 * Extracted to eliminate the identical setup block that was duplicated in
 * `send()` (web) and `generateWhatsAppResponse()` (WhatsApp).
 */

import type { ActionService } from '../action/service';
import { MessageService } from '../message/service';
import {
  buildActionsPrompt,
  buildBehaviorPrompt,
  buildDataEntryAwarenessRule,
  buildKnowledgeBasePrompt,
  buildPlatformRules,
} from './prompts';
import { buildLeadCaptureTool } from './tools';

type Behavior = Parameters<typeof buildBehaviorPrompt>[0];
type LeadAction = Awaited<ReturnType<typeof ActionService.getEnabledByAgent>>[number];

export interface ChatContext {
  /** Vercel AI SDK tools object, or undefined when no actions are configured. */
  tools: { capture_lead: ReturnType<typeof buildLeadCaptureTool> } | undefined;
  /** Fully assembled system prompt string. */
  systemPrompt: string;
  /** Up to 6 recent messages for multi-turn lead collection (empty if no actions). */
  priorMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** The matched lead_generation action, if enabled. Used for lead capture in onFinish. */
  leadAction: LeadAction | undefined;
}

export async function buildChatContext({
  agentId,
  conversationId,
  orgId,
  knowledgeBase,
  behavior,
  hasExistingConversation,
  leadAction,
  entities,
}: {
  agentId: string;
  /** Pass undefined for brand-new WhatsApp conversations. */
  conversationId: string | undefined;
  orgId: string;
  knowledgeBase: string;
  behavior: Behavior;
  /** Whether a conversation record already exists (gates history loading). */
  hasExistingConversation: boolean;
  /** Pre-fetched lead_generation action (if enabled). */
  leadAction: LeadAction | undefined;
  /** Lead fields already collected in prior turns. */
  entities?: Record<string, string>;
}): Promise<ChatContext> {
  const tools = leadAction
    ? { capture_lead: buildLeadCaptureTool(leadAction.config) }
    : undefined;

  const successMessage = leadAction?.config?.successMessage ?? "Thanks! We'll be in touch.";

  const systemPromptParts = [
    buildPlatformRules({ hasLeadCollection: !!tools }),
    buildBehaviorPrompt(behavior),
    buildKnowledgeBasePrompt(knowledgeBase),
  ];
  if (tools) {
    systemPromptParts.push(buildDataEntryAwarenessRule());
    systemPromptParts.push(buildActionsPrompt(successMessage, entities));
  }
  const systemPrompt = systemPromptParts.join('\n');

  // Load recent history for conversational context. Entities now own field
  // state, so 10 messages (5 turns) is enough without inflating the prompt.
  const historyMessages =
    leadAction && conversationId && hasExistingConversation
      ? await MessageService.getMessages({ conversationId, orgId })
      : [];
  const priorMessages = historyMessages.slice(-10).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  return { tools, systemPrompt, priorMessages, leadAction };
}
