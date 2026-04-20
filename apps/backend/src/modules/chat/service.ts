import { createId } from '@paralleldrive/cuid2';
import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { conversations } from '../../db/schema/conversations';
import { BehaviourService } from '../behaviour/service';
import { ChannelService } from '../channel/service';
import { ChatbotService } from '../chatbot/service';
import { ConversationService } from '../conversation/service';
import { IndexingService } from '../indexing/service';
import { OrgUsageMonthlyService } from '../subscription/usage';
import { SubscriptionService } from '../subscription/service';
import type { IChannelWhatsAppConfig } from '../channel/model';
import { WhatsAppConnectionService } from '../whatsapp/connectionService';
import { referenceResolverPrompt } from './prompts';
import { buildChatContext } from './context';
import { handleLeadCapture, persistMessages } from './persistence';

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
  }: {
    currentUserMessage: string;
    lastAssistantUtterance: string;
  }) {
    const resolverPrompt = referenceResolverPrompt({
      currentUserMessage,
      lastAssistantUtterance,
    });
    const { text } = await generateText({
      model: nanoModel,
      prompt: resolverPrompt,
      maxOutputTokens: 50,
      temperature: 0,
    });

    return text.trim() || currentUserMessage;
  }

  static async getFinalQuery({
    message,
    conversation,
  }: {
    message: string;
    conversation?: typeof conversations.$inferSelect;
  }) {
    if (!conversation?.lastAssistantUtterance) return message;

    return ChatService.resolveReferences({
      lastAssistantUtterance: conversation.lastAssistantUtterance,
      currentUserMessage: message,
    });
  }

  static async getSearchChunks(finalQuery: string, chatbotId: string) {
    const chunks = await IndexingService.findRelevantContent(finalQuery, chatbotId);
    return {
      chunks,
      knowledgeBase: chunks.map((c) => c.content).join('\n---\n'),
    };
  }

  static async getChatbot({ chatbotId, orgId }: { chatbotId: string; orgId: string }) {
    const chatbot = await ChatbotService.single({ id: chatbotId, orgId });

    if (chatbot && chatbot.chatbotStatus === 'active') {
      return chatbot;
    }

    throw new NotFoundError('Chatbot not found or inactive');
  }

  static async getBehaviour(chatbotId: string) {
    const behaviour = await BehaviourService.singleByChatbot(chatbotId);

    if (!behaviour) {
      throw new NotFoundError('Behaviour not found');
    }

    return behaviour;
  }

  // ── Sentiment scoring (paid plans) ────────────────────────────────────────

  static async scoreSentiment(assistantMessage: string) {
    try {
      const { text: sentimentJson } = await generateText({
        model: nanoModel,
        prompt: `Classify the sentiment of this AI assistant response as positive, neutral, or negative, and give a confidence score between 0 and 1.\nRespond with JSON only, no explanation: {"label":"positive|neutral|negative","score":0.0}\n\n"${assistantMessage}"`,
        maxOutputTokens: 30,
        temperature: 0,
      });
      return JSON.parse(sentimentJson.trim()) as {
        label: 'positive' | 'neutral' | 'negative';
        score: number;
      };
    } catch {
      return null;
    }
  }

  // ── Web (streaming) ───────────────────────────────────────────────────────

  static async send({
    chatbotId,
    channelId,
    message,
    conversationId,
    orgId,
    ip,
  }: {
    chatbotId: string;
    conversationId: string;
    message: string;
    channelId: string;
    orgId: string;
    ip?: string;
  }) {
    await ChatService.assertMessagesPerMonthLimitNotReached(orgId);
    await ChatService.getChatbot({ chatbotId, orgId });

    const conversation = await ConversationService.single({ id: conversationId, orgId });
    const behavior = await ChatService.getBehaviour(chatbotId);
    const finalQuery = await ChatService.getFinalQuery({ message, conversation });
    const { knowledgeBase, chunks } = await ChatService.getSearchChunks(finalQuery, chatbotId);

    const { tools, systemPrompt, priorMessages } = await buildChatContext({
      chatbotId,
      conversationId,
      orgId,
      knowledgeBase,
      behavior,
      hasExistingConversation: !!conversation,
    });

    const result = streamText({
      system: systemPrompt,
      model,
      messages: [...priorMessages, { role: 'user', content: finalQuery }],
      ...(tools ? { tools, maxSteps: 2 } : {}),
      onFinish: async ({ text: assistantMessage, toolCalls }) => {
        const conversationData = {
          lastUserQuestion: finalQuery,
          lastAssistantUtterance: assistantMessage,
          lastMessageAt: new Date(),
        };

        const isNew = !conversation;
        if (isNew) {
          await ConversationService.create({
            id: conversationId,
            chatbotId,
            channelId,
            ...conversationData,
          });
        } else {
          await ConversationService.update(conversationId, conversationData);
        }

        await OrgUsageMonthlyService.incrementAssistantMessages(orgId);

        await handleLeadCapture(toolCalls ?? [], { chatbotId, conversationId, channelId, orgId });

        // Sentiment scoring — paid plans only
        const plan = await SubscriptionService.getPlan(orgId);
        const sentiment = plan !== 'free'
          ? await ChatService.scoreSentiment(assistantMessage)
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
          void enrichConversationAsync(conversationId, message, isNew, ip);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  }

  // ── WhatsApp — LLM call ───────────────────────────────────────────────────

  static async generateWhatsAppResponse({
    chatbotId,
    channelId,
    message,
    conversationId,
    orgId,
    ip,
  }: {
    chatbotId: string;
    channelId: string;
    message: string;
    conversationId?: string;
    orgId: string;
    ip?: string;
  }) {
    await ChatService.assertMessagesPerMonthLimitNotReached(orgId);
    await ChatService.getChatbot({ chatbotId, orgId });

    const conversation = conversationId
      ? await ConversationService.single({ id: conversationId, orgId })
      : undefined;

    const behavior = await ChatService.getBehaviour(chatbotId);
    const finalQuery = await ChatService.getFinalQuery({ message, conversation });
    const { knowledgeBase, chunks } = await ChatService.getSearchChunks(finalQuery, chatbotId);

    const { tools, systemPrompt, priorMessages } = await buildChatContext({
      chatbotId,
      conversationId,
      orgId,
      knowledgeBase,
      behavior,
      hasExistingConversation: !!conversation,
    });

    const result = await generateText({
      model,
      system: systemPrompt,
      messages: [...priorMessages, { role: 'user', content: finalQuery }],
      ...(tools ? { tools, maxSteps: 2 } : {}),
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
        chatbotId: channel.chatbotId,
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
        chatbotId: channel.chatbotId,
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
      chatbotId: channel.chatbotId,
      conversationId,
      channelId,
      orgId,
    });

    await persistMessages({
      conversationId,
      userMessage: message,
      assistantMessage,
      finalQuery,
      chunks,
      sentiment: null, // WhatsApp doesn't score sentiment
    });
  }

  // ── Web — channel-level entry point ──────────────────────────────────────

  static async sendWeb({
    channelId,
    conversationId,
    message,
    orgId,
    ip,
  }: {
    channelId: string;
    message: string;
    conversationId: string;
    orgId: string;
    ip?: string;
  }) {
    const channel = await ChannelService.single({ id: channelId, orgId });

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    return ChatService.send({
      chatbotId: channel.chatbotId,
      conversationId,
      channelId,
      message,
      orgId,
      ip,
    });
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Fire-and-forget: attach country (IP lookup) and topic (AI label) to a conversation. */
async function enrichConversationAsync(
  conversationId: string,
  firstUserMessage: string,
  isNew: boolean,
  ip?: string,
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
        const { text: topic } = await generateText({
          model: nanoModel,
          prompt: `In 2-5 words, what topic is this question about? Reply with ONLY the topic label, nothing else.\n\n"${firstUserMessage}"`,
          maxOutputTokens: 20,
          temperature: 0,
        });
        const cleanTopic = topic.trim().replace(/^["']|["']$/g, '');
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
