/**
 * Builds the LLM context (tools, system prompt, prior history) for a chat turn.
 *
 * Extracted to eliminate the identical setup block that was duplicated in
 * `send()` (web) and `generateWhatsAppResponse()` (WhatsApp).
 */

import { ActionService } from '../action/service';
import { MessageService } from '../message/service';
import {
  buildActionsPrompt,
  buildBehaviorPrompt,
  buildKnowledgeBasePrompt,
  buildPlatformRules,
} from './prompts';
import { buildLeadCaptureTool } from './tools';

type Behavior = Parameters<typeof buildBehaviorPrompt>[0];
type LeadAction = Awaited<ReturnType<typeof ActionService.getEnabledByChatbot>>[number];

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
  chatbotId,
  conversationId,
  orgId,
  knowledgeBase,
  behavior,
  hasExistingConversation,
}: {
  chatbotId: string;
  /** Pass undefined for brand-new WhatsApp conversations. */
  conversationId: string | undefined;
  orgId: string;
  knowledgeBase: string;
  behavior: Behavior;
  /** Whether a conversation record already exists (gates history loading). */
  hasExistingConversation: boolean;
}): Promise<ChatContext> {
  const enabledActions = await ActionService.getEnabledByChatbot(chatbotId);
  const leadAction = enabledActions.find((a) => a.actionType === 'lead_generation');

  const tools = leadAction
    ? { capture_lead: buildLeadCaptureTool(leadAction.config) }
    : undefined;

  const successMessage = leadAction?.config?.successMessage ?? "Thanks! We'll be in touch.";

  const systemPromptParts = [
    buildPlatformRules(),
    buildBehaviorPrompt(behavior),
    buildKnowledgeBasePrompt(knowledgeBase),
  ];
  if (tools) {
    systemPromptParts.push(buildActionsPrompt(successMessage));
  }
  const systemPrompt = systemPromptParts.join('\n');

  // Load recent history only when actions are active — needed for multi-turn
  // lead data collection (e.g. name in one message, email in the next).
  // Zero extra cost for chatbots that have no actions configured.
  const historyMessages =
    leadAction && conversationId && hasExistingConversation
      ? await MessageService.getMessages({ conversationId, orgId })
      : [];
  const priorMessages = historyMessages.slice(-6).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  return { tools, systemPrompt, priorMessages, leadAction };
}
