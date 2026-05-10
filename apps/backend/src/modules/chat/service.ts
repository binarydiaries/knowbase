import { createId } from '@paralleldrive/cuid2';
import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { conversations } from '../../db/schema/conversations';
import { BehaviourService } from '../behaviour/service';
import { ChannelService } from '../channel/service';
import { AgentService } from '../agent/service';
import { ConversationService } from '../conversation/service';
import { IndexingService } from '../indexing/service';
import { OrgUsageMonthlyService } from '../subscription/usage';
import { SubscriptionService } from '../subscription/service';
import type { IChannelWebConfig, IChannelWhatsAppConfig, IChannelSlackConfig } from '../channel/model';
import { WhatsAppConnectionService } from '../whatsapp/connectionService';
import { SlackConnectionService } from '../slack/connectionService';
import { AiCostEventService } from '../admin/costEvent.service';
import { referenceResolverPrompt } from './prompts';
import { buildChatContext } from './context';
import { handleLeadCapture, persistMessages } from './persistence';
import { ActionService } from '../action/service';

const model = openai('gpt-4.1-mini');
const nanoModel = openai('gpt-4.1-nano');

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class MessageLimitReachedError extends Error {
  constructor(
    readonly payload: Awaited<
      ReturnType<typeof SubscriptionService.assertMessagesPerMonthLimitNotReached>
    > & { allowed: false },
  ) {
    super(SubscriptionService.getMessageLimitReachedMessage(payload));
    this.name = 'MessageLimitReachedError';
  }
}

export class DomainNotAllowedError extends Error {
  constructor() {
    super('Domain not allowed');
    this.name = 'DomainNotAllowedError';
  }
}

// ---------------------------------------------------------------------------
// ChatService
// ---------------------------------------------------------------------------

export abstract class ChatService {
  // ── Guards ────────────────────────────────────────────────────────────────

  static async assertMessagesPerMonthLimitNotReached(orgId: string) {
    const messageLimit =
      await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);

    if (!messageLimit.allowed) {
      throw new MessageLimitReachedError(messageLimit);
    }
  }

  // ── Query helpers ─────────────────────────────────────────────────────────

  static async resolveReferences({
    currentUserMessage,
    lastAssistantUtterance,
    orgId,
    agentId,
    conversationId,
  }: {
    currentUserMessage: string;
    lastAssistantUtterance: string;
    orgId: string;
    agentId: string;
    conversationId?: string;
  }) {
    const resolverPrompt = referenceResolverPrompt({
      currentUserMessage,
      lastAssistantUtterance,
    });
    const result = await generateText({
      model: nanoModel,
      prompt: resolverPrompt,
      maxOutputTokens: 50,
      temperature: 0,
    });
    await AiCostEventService.recordEvent({
      orgId,
      agentId,
      conversationId,
      provider: 'openai',
      model: 'gpt-4.1-nano',
      usage: result.usage ?? {},
      metadata: { operation: 'resolve-references' },
    });

    return result.text.trim() || currentUserMessage;
  }

  static async getFinalQuery({
    message,
    conversation,
    orgId,
    agentId,
    conversationId,
  }: {
    message: string;
    conversation?: typeof conversations.$inferSelect;
    orgId: string;
    agentId: string;
    conversationId?: string;
  }) {
    if (!conversation?.lastAssistantUtterance) return message;

    // Data-entry responses (name, email, phone, company) have no references
    // to resolve. Skipping the resolver avoids nano-model mishandling and
    // saves a round-trip.
    const isDataEntry = Object.keys(
      ChatService.extractLeadFieldsHeuristically(message, conversation.lastAssistantUtterance),
    ).length > 0;
    if (isDataEntry) return message;

    return ChatService.resolveReferences({
      lastAssistantUtterance: conversation.lastAssistantUtterance,
      currentUserMessage: message,
      orgId,
      agentId,
      conversationId,
    });
  }

  static async getSearchChunks(
    finalQuery: string,
    agentId: string,
    orgId: string,
    conversationId?: string,
  ) {
    const chunks = await IndexingService.findRelevantContent(finalQuery, agentId, orgId, conversationId);
    return {
      chunks,
      knowledgeBase: chunks.map((c) => c.content).join('\n---\n'),
    };
  }

  static extractLeadFieldsHeuristically(
    message: string,
    lastAssistantUtterance: string,
  ): Record<string, string> {
    const clean = message.trim();

    // Skip questions or unusually long messages — not a data-entry reply
    if (clean.endsWith('?') || clean.length > 80) return {};

    // Email
    const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) return { email: emailMatch[0] };

    // Phone: 7–15 digits, optional +/spaces/dashes
    const digitsOnly = clean.replace(/[\s\-\(\)\.]/g, '');
    if (/^\+?[\d]{7,15}$/.test(digitsOnly)) return { phone: clean };

    // Explicit name prefix ("Name: Keshav" / "my name is Keshav")
    const namedPrefix = clean.match(/^(?:my )?name(?:\s+is)?\s*[:\-]?\s*(.+)$/i);
    if (namedPrefix) return { name: namedPrefix[1].trim() };

    // Context-based: map the reply to whatever the assistant just asked for
    const lower = lastAssistantUtterance.toLowerCase();
    if (/\bname\b/.test(lower) && !/\bcompany\b|\bemail\b|\bphone\b/.test(lower)) {
      return { name: clean };
    }
    if (/\bcompany\b|\borganization\b|\borganisation\b/.test(lower)) {
      return { company: clean };
    }

    return {};
  }

  static getStoredEntities(
    conversation: typeof conversations.$inferSelect | null | undefined,
  ): Record<string, string> {
    return (conversation?.entities as Record<string, string>) ?? {};
  }

  static async extractAndSaveLeadEntities({
    message,
    conversation,
    conversationId,
  }: {
    message: string;
    conversation: typeof conversations.$inferSelect | null | undefined;
    conversationId: string;
  }): Promise<void> {
    const lastAssistantUtterance = conversation?.lastAssistantUtterance;
    if (!lastAssistantUtterance) return;

    const extracted = ChatService.extractLeadFieldsHeuristically(message, lastAssistantUtterance);
    if (!Object.keys(extracted).length) return;

    const existing = (conversation?.entities as Record<string, string>) ?? {};
    const merged = { ...existing, ...extracted };
    try {
      await ConversationService.update(conversationId, { entities: merged });
    } catch (error) {
      console.error('[entity-extraction] failed to save:', error);
    }
  }

  static async getAgent({ agentId, orgId }: { agentId: string; orgId: string }) {
    const agent = await AgentService.single({ id: agentId, orgId });

    if (agent && agent.agentStatus === 'active') {
      return agent;
    }

    throw new NotFoundError('Agent not found or inactive');
  }

  static async getBehaviour(agentId: string) {
    const behaviour = await BehaviourService.singleByAgent(agentId);

    if (!behaviour) {
      throw new NotFoundError('Behaviour not found');
    }

    return behaviour;
  }

  // ── Sentiment scoring (paid plans) ────────────────────────────────────────

  static async scoreSentiment({
    assistantMessage,
    orgId,
    agentId,
    conversationId,
  }: {
    assistantMessage: string;
    orgId: string;
    agentId: string;
    conversationId: string;
  }) {
    try {
      const result = await generateText({
        model: nanoModel,
        prompt: `Classify the sentiment of this AI assistant response as positive, neutral, or negative, and give a confidence score between 0 and 1.\nRespond with JSON only, no explanation: {"label":"positive|neutral|negative","score":0.0}\n\n"${assistantMessage}"`,
        maxOutputTokens: 30,
        temperature: 0,
      });
      await AiCostEventService.recordEvent({
        orgId,
        agentId,
        conversationId,
        provider: 'openai',
        model: 'gpt-4.1-nano',
        usage: result.usage ?? {},
        metadata: { operation: 'sentiment-score' },
      });
      return JSON.parse(result.text.trim()) as {
        label: 'positive' | 'neutral' | 'negative';
        score: number;
      };
    } catch {
      return null;
    }
  }

  // ── Web (streaming) ───────────────────────────────────────────────────────

  static async send({
    agentId,
    channelId,
    message,
    conversationId,
    orgId,
    ip,
  }: {
    agentId: string;
    conversationId: string;
    message: string;
    channelId: string;
    orgId: string;
    ip?: string;
  }) {
    await ChatService.assertMessagesPerMonthLimitNotReached(orgId);
    await ChatService.getAgent({ agentId, orgId });

    const rawConversation = await ConversationService.single({ id: conversationId, orgId });
    // Discard if the stored record belongs to a different channel (can happen
    // when the same client-generated ID is reused across agents in the same org).
    const conversation = rawConversation?.channelId === channelId ? rawConversation : undefined;
    const behavior = await ChatService.getBehaviour(agentId);
    const finalQuery = await ChatService.getFinalQuery({
      message,
      conversation,
      orgId,
      agentId,
      conversationId,
    });
    const { knowledgeBase, chunks } = await ChatService.getSearchChunks(finalQuery, agentId, orgId, conversationId);

    const enabledActions = await ActionService.getEnabledByAgent(agentId);
    const leadAction = enabledActions.find((a) => a.actionType === 'lead_generation');

    // Load entities saved from PREVIOUS turns only — extracting from the
    // current message here would cause the model to say "I already have X"
    // in the same turn the user just provided it.
    const entities = leadAction ? ChatService.getStoredEntities(conversation) : undefined;

    // Detect if the current message is a data-entry response so we can inject
    // an explicit "user just provided X: Y" hint — more reliable than relying
    // on the model to infer it from conversation history.
    const currentDataEntry = leadAction && conversation?.lastAssistantUtterance
      ? ChatService.extractLeadFieldsHeuristically(message, conversation.lastAssistantUtterance)
      : undefined;

    const { tools, systemPrompt, priorMessages } = await buildChatContext({
      agentId,
      conversationId,
      orgId,
      knowledgeBase,
      behavior,
      hasExistingConversation: !!conversation,
      leadAction,
      entities,
      currentDataEntry,
    });

    const result = streamText({
      system: systemPrompt,
      model,
      messages: [...priorMessages, { role: 'user', content: finalQuery }],
      ...(tools ? { tools, maxSteps: 1 } : {}),
      onFinish: async ({ text: assistantMessage, toolCalls, usage }) => {
        const conversationData = {
          lastUserQuestion: finalQuery,
          lastAssistantUtterance: assistantMessage,
          lastMessageAt: new Date(),
        };

        const isNew = !conversation;
        if (isNew) {
          await ConversationService.create({
            id: conversationId,
            agentId,
            channelId,
            ...conversationData,
          });
        } else {
          await ConversationService.update(conversationId, conversationData);
        }

        // Extract entities from this turn's user message and save for next turn
        if (leadAction && conversationId) {
          void ChatService.extractAndSaveLeadEntities({ message, conversation, conversationId });
        }

        await OrgUsageMonthlyService.incrementAssistantMessages(orgId);
        await AiCostEventService.recordEvent({
          orgId,
          agentId,
          conversationId,
          provider: 'openai',
          model: 'gpt-4.1-mini',
          usage: usage ?? {},
          metadata: { operation: 'web-chat-response' },
        });

        await handleLeadCapture(toolCalls ?? [], { agentId, conversationId, channelId, orgId });

        // Sentiment scoring — paid plans only
        const plan = await SubscriptionService.getPlan(orgId);
        const sentiment = plan !== 'free'
          ? await ChatService.scoreSentiment({
            assistantMessage,
            orgId,
            agentId,
            conversationId,
          })
          : null;

        await persistMessages({
          conversationId,
          userMessage: message,
          assistantMessage,
          finalQuery,
          chunks,
          sentiment,
        });

        // Fire-and-forget enrichment — paid plans only
        if (plan !== 'free') {
          void enrichConversationAsync({
            conversationId,
            firstUserMessage: message,
            isNew,
            orgId,
            agentId,
            ip,
          });
        }
      },
    });

    return result.toUIMessageStreamResponse();
  }

  // ── WhatsApp — LLM call ───────────────────────────────────────────────────

  static async generateWhatsAppResponse({
    agentId,
    channelId,
    message,
    conversationId,
    orgId,
    ip,
  }: {
    agentId: string;
    channelId: string;
    message: string;
    conversationId?: string;
    orgId: string;
    ip?: string;
  }) {
    await ChatService.assertMessagesPerMonthLimitNotReached(orgId);
    await ChatService.getAgent({ agentId, orgId });

    const conversation = conversationId
      ? await ConversationService.single({ id: conversationId, orgId })
      : undefined;

    const behavior = await ChatService.getBehaviour(agentId);
    const finalQuery = await ChatService.getFinalQuery({
      message,
      conversation,
      orgId,
      agentId,
      conversationId,
    });
    const { knowledgeBase, chunks } = await ChatService.getSearchChunks(finalQuery, agentId, orgId, conversationId);

    const enabledActions = await ActionService.getEnabledByAgent(agentId);
    const leadAction = enabledActions.find((a) => a.actionType === 'lead_generation');

    const entities = leadAction ? ChatService.getStoredEntities(conversation) : undefined;

    const currentDataEntry = leadAction && conversation?.lastAssistantUtterance
      ? ChatService.extractLeadFieldsHeuristically(message, conversation.lastAssistantUtterance)
      : undefined;

    const { tools, systemPrompt, priorMessages } = await buildChatContext({
      agentId,
      conversationId,
      orgId,
      knowledgeBase,
      behavior,
      hasExistingConversation: !!conversation,
      leadAction,
      entities,
      currentDataEntry,
    });

    const result = await generateText({
      model,
      system: systemPrompt,
      messages: [...priorMessages, { role: 'user', content: finalQuery }],
      ...(tools ? { tools, maxSteps: 1 } : {}),
    });
    await AiCostEventService.recordEvent({
      orgId,
      agentId,
      conversationId,
      provider: 'openai',
      model: 'gpt-4.1-mini',
      usage: result.usage ?? {},
      metadata: { operation: 'whatsapp-chat-response' },
    });

    return {
      assistantMessage: result.text,
      chunks,
      finalQuery,
      conversation,
      toolCalls: result.toolCalls ?? [],
      channelId,
    };
  }

  // ── WhatsApp — full handler ───────────────────────────────────────────────

  static async sendWhatsApp({
    channelId,
    orgId,
    senderPhone,
    message,
    messageId,
    ip,
  }: {
    channelId: string;
    orgId: string;
    senderPhone: string;
    message: string;
    messageId?: string;
    ip?: string;
  }) {
    const channel = await ChannelService.single({ id: channelId, orgId });
    if (!channel || channel.type !== 'whatsapp') {
      throw new NotFoundError('WhatsApp channel not found');
    }
    const config = channel.config as IChannelWhatsAppConfig;
    if (!config.phoneNumberId) {
      throw new NotFoundError('WhatsApp channel not configured');
    }

    const connection = await WhatsAppConnectionService.findByOrg(orgId);
    if (!connection) {
      throw new NotFoundError('WhatsApp not connected for this org');
    }

    const conversation = await ConversationService.findByExternalId({
      channelId,
      externalId: senderPhone,
    });

    // ── Seen receipt (blue ticks) ─────────────────────────────────────────
    if (messageId) {
      try {
        const seenRes = await fetch(
          `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${connection.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              status: 'read',
              message_id: messageId,
            }),
          },
        );
        if (!seenRes.ok) {
          console.error('[WA seen] error:', await seenRes.text());
        }
      } catch (e) {
        console.error('[WA seen] fetch error:', e);
      }
    }

    // ── Typing indicator ──────────────────────────────────────────────────
    try {
      const typingRes = await fetch(
        `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: senderPhone,
            type: 'typing_indicator',
            typing_indicator: { type: 'text' },
          }),
        },
      );
      if (!typingRes.ok) {
        console.error('[WA typing] error:', await typingRes.text());
      }
    } catch (e) {
      console.error('[WA typing] fetch error:', e);
    }

    const { assistantMessage, chunks, finalQuery, toolCalls } =
      await ChatService.generateWhatsAppResponse({
        agentId: channel.agentId,
        channelId,
        message,
        conversationId: conversation?.id,
        orgId,
        ip,
      });

    // ── Send reply ────────────────────────────────────────────────────────
    await fetch(
      `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: senderPhone,
          type: 'text',
          text: { body: assistantMessage },
        }),
      },
    );

    // ── Persist conversation ──────────────────────────────────────────────
    const conversationData = {
      lastUserQuestion: finalQuery,
      lastAssistantUtterance: assistantMessage,
      lastMessageAt: new Date(),
    };

    let conversationId: string;
    if (!conversation) {
      conversationId = createId();
      await ConversationService.create({
        id: conversationId,
        agentId: channel.agentId,
        channelId,
        externalId: senderPhone,
        ...conversationData,
      });
    } else {
      await ConversationService.update(conversation.id, conversationData);
      conversationId = conversation.id;
    }

    await OrgUsageMonthlyService.incrementAssistantMessages(orgId);

    await handleLeadCapture(toolCalls, {
      agentId: channel.agentId,
      conversationId,
      channelId,
      orgId,
    });

    // Extract entities from this turn's message and save for next turn
    void ChatService.extractAndSaveLeadEntities({ message, conversation, conversationId });

    await persistMessages({
      conversationId,
      userMessage: message,
      assistantMessage,
      finalQuery,
      chunks,
      sentiment: null, // WhatsApp doesn't score sentiment
    });
  }

  // ── Slack — full handler (channel + mention modes) ───────────────────────

  static async sendSlack({
    channelId,
    orgId,
    message,
    slackChannelId,
    threadTs,
    ip,
  }: {
    channelId: string;
    orgId: string;
    message: string;
    slackChannelId: string;
    threadTs: string;
    ip?: string;
  }) {
    const channel = await ChannelService.single({ id: channelId, orgId });
    if (!channel || channel.type !== 'slack') {
      throw new NotFoundError('Slack channel not found');
    }
    const config = channel.config as IChannelSlackConfig;
    if (!config.slackChannelId) {
      throw new NotFoundError('Slack channel not configured');
    }

    const connection = await SlackConnectionService.findByOrg(orgId);
    if (!connection) {
      throw new NotFoundError('Slack not connected for this org');
    }

    // threadTs is the conversation key — each Slack thread = one conversation
    const conversation = await ConversationService.findByExternalId({
      channelId,
      externalId: threadTs,
    });

    // Post typing placeholder before LLM call so users see immediate feedback
    const slackHeaders = {
      Authorization: `Bearer ${connection.botToken}`,
      'Content-Type': 'application/json',
    };
    let placeholderTs: string | null = null;
    try {
      const placeholderRes = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({
          channel: slackChannelId,
          text: '_Thinking…_',
          thread_ts: threadTs,
        }),
      });
      const placeholderData = (await placeholderRes.json()) as { ok: boolean; ts?: string };
      if (placeholderData.ok && placeholderData.ts) {
        placeholderTs = placeholderData.ts;
      }
    } catch {
      // Best-effort — proceed even if placeholder fails
    }

    const { assistantMessage, chunks, finalQuery, toolCalls } =
      await ChatService.generateWhatsAppResponse({
        agentId: channel.agentId,
        channelId,
        message,
        conversationId: conversation?.id,
        orgId,
        ip,
      });

    // Update placeholder with real response, or post new message if placeholder failed
    if (placeholderTs) {
      const updateRes = await fetch('https://slack.com/api/chat.update', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({
          channel: slackChannelId,
          ts: placeholderTs,
          text: assistantMessage,
        }),
      });
      if (!updateRes.ok) {
        console.error('[Slack update] error:', await updateRes.text());
      }
    } else {
      const replyRes = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: slackHeaders,
        body: JSON.stringify({
          channel: slackChannelId,
          text: assistantMessage,
          thread_ts: threadTs,
        }),
      });
      if (!replyRes.ok) {
        console.error('[Slack reply] error:', await replyRes.text());
      }
    }

    // Persist conversation
    const conversationData = {
      lastUserQuestion: finalQuery,
      lastAssistantUtterance: assistantMessage,
      lastMessageAt: new Date(),
    };

    let conversationId: string;
    if (!conversation) {
      conversationId = createId();
      await ConversationService.create({
        id: conversationId,
        agentId: channel.agentId,
        channelId,
        externalId: threadTs,
        ...conversationData,
      });
    } else {
      await ConversationService.update(conversation.id, conversationData);
      conversationId = conversation.id;
    }

    await OrgUsageMonthlyService.incrementAssistantMessages(orgId);

    await handleLeadCapture(toolCalls, {
      agentId: channel.agentId,
      conversationId,
      channelId,
      orgId,
    });

    void ChatService.extractAndSaveLeadEntities({ message, conversation, conversationId });

    await persistMessages({
      conversationId,
      userMessage: message,
      assistantMessage,
      finalQuery,
      chunks,
      sentiment: null,
    });
  }

  // ── Web — channel-level entry point ──────────────────────────────────────

  static async sendWeb({
    channelId,
    conversationId,
    message,
    origin,
    ip,
  }: {
    channelId: string;
    message: string;
    conversationId: string;
    origin?: string;
    ip?: string;
  }) {
    const channel = await ChannelService.singleById(channelId);

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    if (channel.type === 'web') {
      const config = channel.config as IChannelWebConfig;
      const allowedDomains = config.allowedDomains ?? [];
      if (allowedDomains.length > 0) {
        let allowed = false;
        if (origin) {
          try {
            allowed = allowedDomains.includes(new URL(origin).hostname);
          } catch {
            allowed = false;
          }
        }
        if (!allowed) throw new DomainNotAllowedError();
      }
    }

    return ChatService.send({
      agentId: channel.agentId,
      conversationId,
      channelId,
      message,
      orgId: channel.orgId,
      ip,
    });
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Fire-and-forget: attach country (IP lookup) and topic (AI label) to a conversation. */
async function enrichConversationAsync(
  {
    conversationId,
    firstUserMessage,
    isNew,
    orgId,
    agentId,
    ip,
  }: {
    conversationId: string;
    firstUserMessage: string;
    isNew: boolean;
    orgId: string;
    agentId: string;
    ip?: string;
  },
) {
  try {
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
        if (geoRes.ok) {
          const geo = (await geoRes.json()) as { countryCode?: string };
          if (geo.countryCode) {
            await ConversationService.update(conversationId, { country: geo.countryCode });
          }
        }
      } catch {
        // Geo lookup is best-effort
      }
    }

    if (isNew) {
      try {
        const result = await generateText({
          model: nanoModel,
          prompt: `In 2-5 words, what topic is this question about? Reply with ONLY the topic label, nothing else.\n\n"${firstUserMessage}"`,
          maxOutputTokens: 20,
          temperature: 0,
        });
        await AiCostEventService.recordEvent({
          orgId,
          agentId,
          conversationId,
          provider: 'openai',
          model: 'gpt-4.1-nano',
          usage: result.usage ?? {},
          metadata: { operation: 'topic-enrichment' },
        });
        const cleanTopic = result.text.trim().replace(/^["']|["']$/g, '');
        if (cleanTopic) {
          await ConversationService.update(conversationId, { topic: cleanTopic });
        }
      } catch {
        // Topic is best-effort
      }
    }
  } catch {
    // Enrichment is always best-effort
  }
}
