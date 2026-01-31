import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs, streamText } from 'ai';
import type { z } from 'zod';
import type { conversations } from '../../db/schema';
import { BehaviourService } from '../behaviour/service';
import { ChannelService } from '../channel/service';
import { ChatbotService } from '../chatbot/service';
import type { conversationChannel } from '../conversation/model';
import { ConversationService } from '../conversation/service';
import { EmbeddingService } from '../embedding/service';
import { MessageService } from '../message/service';
import {
  buildBehaviorPrompt,
  buildKnowledgeBasePrompt,
  buildPlatformRules,
  getKnowledgeBasePrompt,
  referenceResolverPrompt,
} from './prompts';

const model = openai('gpt-4.1-mini');

export abstract class ChatService {
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

  static async send2({
    conversationId,
    message,
    channelId,
    channel,
  }: {
    conversationId: string;
    message: string;
    channelId: string;
    channel: z.infer<typeof conversationChannel>;
  }) {
    const chatbot = await ChannelService.single(channelId);

    if (!chatbot) {
      throw new Error('Chatbot not found');
    }

    const { chatbotId } = chatbot;

    let finalQuery = message;
    const conversation = await ConversationService.single({
      id: conversationId,
    });
    if (conversation?.lastAssistantUtterance) {
      finalQuery = await ChatService.resolveReferences({
        lastAssistantUtterance: conversation.lastAssistantUtterance,
        currentUserMessage: message,
      });
    }
    const chunks = await EmbeddingService.findRelevantContent(finalQuery);
    const knowledgeBasePrompt = getKnowledgeBasePrompt({
      knowledgeBase: chunks.map((c) => c.content).join('\n---\n'),
    });

    const result = streamText({
      system: knowledgeBasePrompt,
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

        if (!conversation) {
          await ConversationService.create({
            id: conversationId,
            chatbotId,
            channelId,
            ...conversationData,
          });
        } else {
          await ConversationService.update(conversationId, conversationData);
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
            },
          },
        ]);
      },
    });
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
    const chunks = await EmbeddingService.findRelevantContent(finalQuery);
    return {
      chunks,
      knowledgeBase: chunks.map((c) => c.content).join('\n---\n'),
    };
  }

  static async getChatbot(chatbotId: string) {
    const chatbot = await ChatbotService.single({ id: chatbotId });

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

  static async *send({
    chatbotId,
    channelId,
    message,
    conversationId,
  }: {
    chatbotId: string;
    conversationId: string;
    message: string;
    channelId: string;
  }) {
    await ChatService.getChatbot(chatbotId);
    const conversation = await ConversationService.single({
      id: conversationId,
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

        if (!conversation) {
          await ConversationService.create({
            id: conversationId,
            chatbotId,
            channelId,
            ...conversationData,
          });
        } else {
          await ConversationService.update(conversationId, conversationData);
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
            },
          },
        ]);
      },
    });
  }

  static async sendWeb({
    channelId,
    conversationId,
    message,
  }: {
    channelId: string;
    message: string;
    conversationId: string;
  }) {
    const channel = await ChannelService.single(channelId);

    if (!channel) {
      throw new Error('Channel not found');
    }

    return ChatService.send({
      chatbotId: channel.chatbotId,
      conversationId,
      channelId,
      message,
    });
  }
}
