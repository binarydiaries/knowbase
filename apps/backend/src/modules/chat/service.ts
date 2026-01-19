import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs, streamText } from 'ai';
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
    const chunks = await EmbeddingService.findRelevantContent(finalQuery);
    const knowledgeBasePrompt = getKnowledgeBasePrompt({
      knowledgeBase: chunks.map((c) => c.name).join('\n---\n'),
    });

    const result = streamText({
      system: knowledgeBasePrompt,
      model,
      messages: [{ role: 'user', content: finalQuery }],
      stopWhen: stepCountIs(5),
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
}
