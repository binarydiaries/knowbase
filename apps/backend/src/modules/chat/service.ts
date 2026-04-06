import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs, streamText } from 'ai';
import type { conversations } from '../../db/schema/conversations';
import { BehaviourService } from '../behaviour/service';
import { ChannelService } from '../channel/service';
import { ChatbotService } from '../chatbot/service';
import { ConversationService } from '../conversation/service';
import { IndexingService } from '../indexing/service';
import { MessageService } from '../message/service';
import { SubscriptionService } from '../subscription/service';
import { OrgUsageMonthlyService } from '../subscription/usage';
import {
  buildBehaviorPrompt,
  buildKnowledgeBasePrompt,
  buildPlatformRules,
  referenceResolverPrompt,
} from './prompts';

const model = openai('gpt-4.1-mini');
const nanoModel = openai('gpt-4.1-nano');

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
      model: model,
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

  static async getSearchChunks(finalQuery: string) {
    const chunks = await IndexingService.findRelevantContent(finalQuery);
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

    throw new Error('Chatbot not found or inactive');
  }

  static async getBehaviour(chatbotId: string) {
    const behaviour = await BehaviourService.singleByChatbot(chatbotId);

    if (!behaviour) {
      throw new Error('Behaviour not found');
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
      await ChatService.getSearchChunks(finalQuery);

    const systemPrompt = [
      buildPlatformRules(),
      buildBehaviorPrompt(behavior),
      buildKnowledgeBasePrompt(knowledgeBase),
    ].join('\n');

    const result = streamText({
      system: systemPrompt,
      model,
      messages: [{ role: 'user', content: finalQuery }],
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
      onFinish: async ({ responseMessage }) => {
        const assistantMessage =
          responseMessage?.parts?.find((value) => value?.type === 'text')
            ?.text || '';
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

        // Compute sentiment before saving (sequential, runs after stream — user doesn't feel it)
        let sentiment: {
          label: 'positive' | 'neutral' | 'negative';
          score: number;
        } | null = null;
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
              confidenceScore:
                chunks.reduce((acc, chunk) => acc + chunk.similarity, 0) /
                chunks.length,
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

        // Fire-and-forget: enrich conversation with country + topic (new convs only)
        void enrichConversationAsync(conversationId, message, isNew, ip);
      },
    });
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
      throw new Error('Channel not found');
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
