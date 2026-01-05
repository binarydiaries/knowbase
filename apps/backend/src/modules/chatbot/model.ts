import { Elysia } from 'elysia';
import { z } from 'zod';

const ChatbotStatus = z.enum(['draft', 'live', 'archived']);

const Chatbot = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  status: ChatbotStatus,
  createdBy: z.string(),
  orgId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CreateChatbotBody = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const OneChatbotResponse = z.object({
  chatbot: Chatbot,
});

export const ChatbotModel = new Elysia().model({
  Chatbot,
  CreateChatbotBody,
  OneChatbotResponse,
});
