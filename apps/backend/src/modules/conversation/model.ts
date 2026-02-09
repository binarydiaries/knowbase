import { Elysia } from 'elysia';
import { z } from 'zod';

const Conversation = z.object({
  id: z.string(),
  chatbotId: z.string(),
  lastUserQuestion: z.string(),
  lastAssistantUtterance: z.string(),
  lastMessageAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ListConversation = z.object({
  chatbotId: z.string().optional(),
});

const ManyConversationResponse = z.object({
  conversations: z.array(Conversation),
});

export const ConversationModel = new Elysia().model({
  ListConversation,
  ManyConversationResponse,
});
