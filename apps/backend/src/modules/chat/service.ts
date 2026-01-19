import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs, streamText } from 'ai';
import type { z } from 'zod';
import type { conversationChannel } from '../conversation/model';
import { ConversationService } from '../conversation/service';
import { EmbeddingService } from '../embedding/service';
import { MessageService } from '../message/service';
import { getKnowledgeBasePrompt, referenceResolverPrompt } from './prompts';

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

  static async send({
    conversationId,
    message,
    chatbotId,
    channel,
    orgId,
    visitorId,
  }: {
    conversationId: string;
    message: string;
    chatbotId: string;
    channel: z.infer<typeof conversationChannel>;
    orgId: string;
    visitorId: string;
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
            orgId,
            chatbotId,
            channel,
            visitorId,
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
}
