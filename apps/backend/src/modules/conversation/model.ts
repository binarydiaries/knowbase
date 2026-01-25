import { Elysia } from 'elysia';
import { z } from 'zod';

export const conversationChannel = z.enum(['web', 'instagram', 'whatsapp']);

const Conversation = z.object({
  id: z.string(),
  chatbotId: z.string(),
  channel: conversationChannel,
  lastUserQuestion: z.string(),
  lastAssistantUtterance: z.string(),
  lastMessageAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ListConversation = z.object({
  chatbotId: z.string(),
});

const ManyConversationResponse = z.object({
  conversations: z.array(Conversation),
});

export const ConversationModel = new Elysia().model({
  ListConversation,
  ManyConversationResponse,
});
