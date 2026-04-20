import { createId } from '@paralleldrive/cuid2';
import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { conversations } from '../../db/schema/conversations';
import { BehaviourService } from '../behaviour/service';
import { ChannelService } from '../channel/service';
import { ChatbotService } from '../chatbot/service';
import { ConversationService } from '../conversation/service';
import { IndexingService } from '../indexing/service';
import { ActionService } from '../action/service';
import { LeadService } from '../lead/service';
import { MessageService } from '../message/service';
import { SubscriptionService } from '../subscription/service';
import { OrgUsageMonthlyService } from '../subscription/usage';
import type { IChannelWhatsAppConfig } from '../channel/model';
import { WhatsAppConnectionService } from '../whatsapp/connectionService';
import {
  buildActionsPrompt,
  buildBehaviorPrompt,
  buildKnowledgeBasePrompt,
  buildPlatformRules,
  referenceResolverPrompt,
} from './prompts';
import { buildLeadCaptureTool } from './tools';

const model = openai('gpt-4.1-mini');
const nanoModel = openai('gpt-4.1-nano');

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

export abstract class ChatService {
  static async assertMessagesPerMonthLimitNotReached(orgId: string) {
    const messageLimit =
      await SubscriptionService.assertMessagesPerMonthLimitNotReached(orgId);

    if (!messageLimit.allowed) {
      throw new MessageLimitReachedError(messageLimit);
    }
  }

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
    let finalQuery = message;
    if (conversation?.lastAssistantUtterance) {
      finalQuery = await ChatService.resolveReferences({
        lastAssistantUtterance: conversation.lastAssistantUtterance,
        currentUserMessage: message,
      });
    }

    return finalQuery;
  }

  static async getSearchChunks(finalQuery: string, chatbotId: string) {
    const chunks = await IndexingService.findRelevantContent(finalQuery, chatbotId);
    return {
      chunks,
      knowledgeBase: chunks.map((c) => c.content).join('\n---\n'),
    };
  }

  static async getChatbot({
    chatbotId,
    orgId,
  }: {
    chatbotId: string;
    orgId: string;
  }) {
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
    const conversation = await ConversationService.single({
      id: conversationId,
      orgId,
    });
    const behavior = await ChatService.getBehaviour(chatbotId);
    const finalQuery = await ChatService.getFinalQuery({
      message,
      conversation,
    });
    const { knowledgeBase, chunks } =
      await ChatService.getSearchChunks(finalQuery, chatbotId);

    // Load enabled actions — only adds cost/tools if actions are configured
    const enabledActions = await ActionService.getEnabledByChatbot(chatbotId);
    const leadAction = enabledActions.find((a) => a.actionType === 'lead_generation');

    // Build tools and system prompt additions when actions are enabled
    const tools = leadAction
      ? { capture_lead: buildLeadCaptureTool(leadAction.config) }
      : undefined;

    const successMessage =
      leadAction?.config?.successMessage ?? "Thanks! We'll be in touch.";

    const systemPromptParts = [
      buildPlatformRules(),
      buildBehaviorPrompt(behavior),
      buildKnowledgeBasePrompt(knowledgeBase),
    ];
    if (tools) {
      systemPromptParts.push(buildActionsPrompt(successMessage));
    }
    const systemPrompt = systemPromptParts.join('\n');

    // Pass recent conversation history only when actions are active (for multi-turn collection)
    const historyMessages = leadAction && conversation
      ? await MessageService.getMessages({ conversationId, orgId })
      : [];
    const priorMessages = historyMessages.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

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

        // Handle action tool calls
        for (const toolCall of toolCalls ?? []) {
          if (toolCall.toolName === 'capture_lead') {
            try {
              const input = toolCall.input as {
                name?: string;
                email?: string;
                phone?: string;
                company?: string;
              };
              await LeadService.create({
                chatbotId,
                conversationId,
                channelId,
                orgId,
                name: input.name ?? null,
                email: input.email ?? null,
                phone: input.phone ?? null,
                company: input.company ?? null,
              });
            } catch {
              // Lead capture is best-effort — never break the chat
            }
          }
        }

        // Paid-plan features: sentiment scoring + conversation enrichment
        const plan = await SubscriptionService.getPlan(orgId);
        const isPaidPlan = plan !== 'free';

        // Compute sentiment before saving — only for paid plans
        let sentiment: {
          label: 'positive' | 'neutral' | 'negative';
          score: number;
        } | null = null;
        if (isPaidPlan) {
          try {
            const { text: sentimentJson } = await generateText({
              model: nanoModel,
              prompt: `Classify the sentiment of this AI assistant response as positive, neutral, or negative, and give a confidence score between 0 and 1.\nRespond with JSON only, no explanation: {"label":"positive|neutral|negative","score":0.0}\n\n"${assistantMessage}"`,
              maxOutputTokens: 30,
              temperature: 0,
            });
            sentiment = JSON.parse(sentimentJson.trim());
          } catch {
            // Sentiment is best-effort — ignore failures
          }
        }

        await MessageService.addMessages([
          {
            conversationId,
            role: 'user',
            content: message,
            systemMetadata: { finalQuery },
          },
          {
            conversationId,
            role: 'assistant',
            content: assistantMessage,
            metadata: {
              confidenceScore: chunks.length
                ? chunks.reduce((acc, chunk) => acc + chunk.similarity, 0) / chunks.length
                : 0,
              sources: chunks.map((chunk) => ({
                documentId: chunk.documentId,
                documentVersion: chunk.documentVersion,
                chunkIndex: chunk.chunkIndex,
                similarity: chunk.similarity,
              })),
              sentiment,
            },
          },
        ]);

        // Fire-and-forget: enrich conversation with country + topic — only for paid plans
        if (isPaidPlan) {
          void enrichConversationAsync(conversationId, message, isNew, ip);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  }

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

    // Load enabled actions
    const enabledActions = await ActionService.getEnabledByChatbot(chatbotId);
    const leadAction = enabledActions.find((a) => a.actionType === 'lead_generation');

    const tools = leadAction
      ? { capture_lead: buildLeadCaptureTool(leadAction.config) }
      : undefined;

    const successMessage =
      leadAction?.config?.successMessage ?? "Thanks! We'll be in touch.";

    const systemPromptParts = [
      buildPlatformRules(),
      buildBehaviorPrompt(behavior),
      buildKnowledgeBasePrompt(knowledgeBase),
    ];
    if (tools) {
      systemPromptParts.push(buildActionsPrompt(successMessage));
    }
    const systemPrompt = systemPromptParts.join('\n');

    // Pass recent history for multi-turn lead collection
    const historyMessages = leadAction && conversationId && conversation
      ? await MessageService.getMessages({ conversationId, orgId })
      : [];
    const priorMessages = historyMessages.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const result = await generateText({
      model,
      system: systemPrompt,
      messages: [...priorMessages, { role: 'user', content: finalQuery }],
      ...(tools ? { tools, maxSteps: 2 } : {}),
    });

    const assistantMessage = result.text;
    const toolCalls = result.toolCalls ?? [];

    return { assistantMessage, chunks, finalQuery, conversation, toolCalls, channelId };
  }

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

    // ── Seen receipt (blue ticks) — await so Meta registers it before typing ───
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

    // ── Typing indicator ──────────────────────────────────────────────────────
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

    // Send reply via WhatsApp Cloud API
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

    // Persist conversation + messages
    const conversationData = {
      lastUserQuestion: finalQuery,
      lastAssistantUtterance: assistantMessage,
      lastMessageAt: new Date(),
    };

    let conversationId: string;
    if (!conversation) {
      const newId = createId();
      await ConversationService.create({
        id: newId,
        chatbotId: channel.chatbotId,
        channelId,
        externalId: senderPhone,
        ...conversationData,
      });
      conversationId = newId;
    } else {
      await ConversationService.update(conversation.id, conversationData);
      conversationId = conversation.id;
    }

    await OrgUsageMonthlyService.incrementAssistantMessages(orgId);

    // Handle action tool calls
    for (const toolCall of toolCalls ?? []) {
      if (toolCall.toolName === 'capture_lead') {
        try {
          const input = toolCall.input as {
            name?: string;
            email?: string;
            phone?: string;
            company?: string;
          };
          await LeadService.create({
            chatbotId: channel.chatbotId,
            conversationId,
            channelId,
            orgId,
            name: input.name ?? null,
            email: input.email ?? null,
            phone: input.phone ?? null,
            company: input.company ?? null,
          });
        } catch {
          // Lead capture is best-effort — never break the chat
        }
      }
    }

    const confidenceScore = chunks.length
      ? chunks.reduce((acc, c) => acc + c.similarity, 0) / chunks.length
      : 0;

    await MessageService.addMessages([
      {
        conversationId,
        role: 'user',
        content: message,
        systemMetadata: { finalQuery },
      },
      {
        conversationId,
        role: 'assistant',
        content: assistantMessage,
        metadata: {
          confidenceScore,
          sources: chunks.map((c) => ({
            documentId: c.documentId,
            documentVersion: c.documentVersion,
            chunkIndex: c.chunkIndex,
            similarity: c.similarity,
          })),
          sentiment: null,
        },
      },
    ]);
  }

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

/** Fire-and-forget: attach country (IP lookup) and topic (AI label) to a conversation */
async function enrichConversationAsync(
  conversationId: string,
  firstUserMessage: string,
  isNew: boolean,
  ip?: string,
) {
  try {
    // Country from IP using ip-api.com (free, no key required)
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=countryCode`,
        );
        if (geoRes.ok) {
          const geo = (await geoRes.json()) as { countryCode?: string };
          if (geo.countryCode) {
            await ConversationService.update(conversationId, {
              country: geo.countryCode,
            });
          }
        }
      } catch {
        // Geo lookup is best-effort
      }
    }

    // Topic label — only for brand-new conversations
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
          await ConversationService.update(conversationId, {
            topic: cleanTopic,
          });
        }
      } catch {
        // Topic is best-effort
      }
    }
  } catch {
    // Enrichment is always best-effort — never let it break the main flow
  }
}
