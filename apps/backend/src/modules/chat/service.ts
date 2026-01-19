import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
  validateUIMessages,
} from 'ai';
import { z } from 'zod';
import { ConversationService } from '../conversation/service';
import { EmbeddingService } from '../embedding/service';
import { MessageService } from '../message/service';
import {
  getKnowledgeBasePrompt,
  referenceResolverPrompt,
  systemPrompt,
} from './prompts';

const model = openai('gpt-4.1-mini');

const tools = {
  getInformation: tool({
    description: `Retrieve relevant information from the knowledge base`,
    inputSchema: z.object({
      question: z.string().describe('the users question'),
    }),
    execute: async ({ question }) =>
      EmbeddingService.findRelevantContent(question),
  }),
};

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
  }: {
    conversationId: string;
    message: string;
  }) {
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

    console.log('finalQuery', finalQuery);
    const chunks = await EmbeddingService.findRelevantContent(finalQuery);
    const knowledgeBasePrompt = getKnowledgeBasePrompt({
      knowledgeBase: chunks.map((c) => c.name).join('\n---\n'),
    });

    console.log('chunks', chunks);

    const result = streamText({
      system: knowledgeBasePrompt,
      model,
      messages: [{ role: 'user', content: finalQuery }],
      stopWhen: stepCountIs(5),
      tools,
    });

    return result.toUIMessageStreamResponse({
      onFinish: ({ responseMessage }) => {
        const assistantMessage =
          responseMessage?.parts?.find((value) => value?.type === 'text')
            ?.text || '';
        const conversationData = {
          lastUserQuestion: finalQuery,
          lastAssistantUtterance: assistantMessage,
          lastMessageAt: new Date(),
        };

        if (!conversation) {
          ConversationService.create({
            id: conversationId,
            orgId: '123',
            chatbotId: 'wjyxahoi05zup2xmkz1wnk37',
            channel: 'web',
            visitorId: '',
            ...conversationData,
          });
        } else {
          ConversationService.update(conversationId, conversationData);
        }

        MessageService.addMessages([
          { conversationId, role: 'user', content: message },
          { conversationId, role: 'assistant', content: assistantMessage },
        ]);
      },
    });
  }

  static async send({
    conversationId,
    message,
  }: {
    conversationId: string;
    message: UIMessage;
  }) {
    const existingMessages = await MessageService.getMessages(conversationId);
    const messages: UIMessage[] = [
      ...(existingMessages as unknown as UIMessage[]),
      message,
    ];

    const validatedMessages = await validateUIMessages({
      messages,
    });

    const result = streamText({
      system: systemPrompt,
      model,
      messages: await convertToModelMessages(validatedMessages),
      stopWhen: stepCountIs(5),
      tools,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: ({ messages }) => {
        MessageService.addMessages(
          messages.slice(-2).map((message) => ({
            conversationId,
            role: message.role,
            parts: message.parts,
          })),
        );
      },
    });
  }
}
