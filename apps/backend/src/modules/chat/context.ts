/**
 * Builds the LLM context (tools, system prompt, prior history) for a chat turn.
 *
 * Extracted to eliminate the identical setup block that was duplicated in
 * `send()` (web) and `generateWhatsAppResponse()` (WhatsApp).
 */

import type {
  LeadGenerationConfig,
  SchedulingConfig,
} from '../../db/schema/agentActions';
import type { ActionService } from '../action/service';
import { MessageService } from '../message/service';
import {
  buildActionsPrompt,
  buildBehaviorPrompt,
  buildDataEntryAwarenessRule,
  buildKnowledgeBasePrompt,
  buildPlatformRules,
  buildSchedulingPrompt,
} from './prompts';
import { buildLeadCaptureTool, buildSchedulingTools } from './tools';

type Behavior = Parameters<typeof buildBehaviorPrompt>[0];
type AgentAction = Awaited<
  ReturnType<typeof ActionService.getEnabledByAgent>
>[number];

export interface ChatContext {
  /** Vercel AI SDK tools object, or undefined when no actions are configured. */
  tools:
    | { capture_lead: ReturnType<typeof buildLeadCaptureTool> }
    | ReturnType<typeof buildSchedulingTools>
    | undefined;
  /** Fully assembled system prompt string. */
  systemPrompt: string;
  /** Up to 10 recent messages for multi-turn context (empty if no actions). */
  priorMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** The matched lead_generation action, if enabled. Used for lead capture in onFinish. */
  leadAction: AgentAction | undefined;
  /** The matched scheduling action, if enabled. */
  schedulingAction: AgentAction | undefined;
  /** Whether scheduling tools are active — gates maxSteps=2. */
  hasScheduling: boolean;
}

export async function buildChatContext({
  agentId,
  conversationId,
  channelId,
  orgId,
  knowledgeBase,
  behavior,
  hasExistingConversation,
  leadAction,
  schedulingAction,
  entities,
  currentDataEntry,
  timezone,
}: {
  agentId: string;
  /** Pass undefined for brand-new WhatsApp conversations. */
  conversationId: string | undefined;
  channelId: string;
  orgId: string;
  knowledgeBase: string;
  behavior: Behavior;
  /** Whether a conversation record already exists (gates history loading). */
  hasExistingConversation: boolean;
  /** Pre-fetched lead_generation action (if enabled). */
  leadAction: AgentAction | undefined;
  /** Pre-fetched scheduling action (if enabled). */
  schedulingAction: AgentAction | undefined;
  /** Lead fields already collected in prior turns. */
  entities?: Record<string, string>;
  /** Field(s) the user is providing RIGHT NOW in this turn (heuristically detected). */
  currentDataEntry?: Record<string, string>;
  /** Browser IANA timezone from the client (used when scheduling timezone is 'auto'). */
  timezone?: string;
}): Promise<ChatContext> {
  let tools: ChatContext['tools'];

  if (leadAction) {
    tools = {
      capture_lead: buildLeadCaptureTool(
        leadAction.config as LeadGenerationConfig,
      ),
    };
  } else if (schedulingAction) {
    tools = buildSchedulingTools(
      schedulingAction.config as SchedulingConfig,
      { agentId, conversationId: conversationId ?? '', channelId, orgId },
      timezone,
    );
  }

  const hasScheduling = !!schedulingAction;
  const successMessage =
    (leadAction?.config as LeadGenerationConfig | undefined)?.successMessage ??
    "Thanks! We'll be in touch.";

  const systemPromptParts = [
    buildPlatformRules({ hasLeadCollection: !!leadAction }),
    buildBehaviorPrompt(behavior),
    buildKnowledgeBasePrompt(knowledgeBase),
  ];

  if (leadAction) {
    systemPromptParts.push(buildDataEntryAwarenessRule());
    systemPromptParts.push(
      buildActionsPrompt(successMessage, entities, currentDataEntry),
    );
  }

  if (schedulingAction) {
    systemPromptParts.push(
      buildSchedulingPrompt(
        (schedulingAction.config as SchedulingConfig).triggerInstructions,
      ),
    );
  }

  const systemPrompt = systemPromptParts.join('\n');

  // Load recent history when actions are active (multi-turn context required).
  const needsHistory =
    (leadAction || schedulingAction) &&
    conversationId &&
    hasExistingConversation;
  const historyMessages = needsHistory
    ? await MessageService.getMessages({
        conversationId: conversationId!,
        orgId,
      })
    : [];
  const priorMessages = historyMessages.slice(-10).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  return {
    tools,
    systemPrompt,
    priorMessages,
    leadAction,
    schedulingAction,
    hasScheduling,
  };
}
