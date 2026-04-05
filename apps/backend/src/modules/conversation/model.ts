import { Elysia } from 'elysia';
import { z } from 'zod';

const Conversation = z.object({
  id: z.string(),
  chatbotId: z.string(),
  channelId: z.string(),
  channelType: z.enum(['web', 'whatsapp', 'instagram']),
  lastUserQuestion: z.string(),
  lastAssistantUtterance: z.string(),
  lastMessageAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ListConversation = z.object({
  chatbotId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const ManyConversationResponse = z.object({
  conversations: z.array(Conversation),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const ConversationModel = new Elysia().model({
  ListConversation,
  ManyConversationResponse,
});
