import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs, streamText } from 'ai';
import type { conversations } from '../../db/schema/conversations';
import { BehaviourService } from '../behaviour/service';
import { ChannelService } from '../channel/service';
import { ChatbotService } from '../chatbot/service';
import { ConversationService } from '../conversation/service';
import { EmbeddingService } from '../embedding/service';
import { MessageService } from '../message/service';
import {
  buildBehaviorPrompt,
  buildKnowledgeBasePrompt,
  buildPlatformRules,
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
  }: {
    chatbotId: string;
    conversationId: string;
    message: string;
    channelId: string;
    orgId: string;
  }) {
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
    orgId,
  }: {
    channelId: string;
    message: string;
    conversationId: string;
    orgId: string;
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
    });
  }
}
