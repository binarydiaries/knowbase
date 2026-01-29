import { Elysia } from 'elysia';
import { z } from 'zod';
import { Behaviour } from '../behaviour/model';
import { Document } from '../document/model';

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

const SmallChatbot = Chatbot.pick({
  id: true,
  name: true,
  description: true,
  status: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

const CreateChatbotBody = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const OneChatbotResponse = z.object({
  chatbot: Chatbot,
  documents: z.array(Document),
  behaviour: Behaviour.optional(),
});

const OneSmallChatbotResponse = z.object({
  chatbot: SmallChatbot,
});

const ManyChatbotResponse = z.object({
  chatbots: z.array(SmallChatbot),
});

export const OneChatbotParams = z.object({
  id: z.string(),
});

export const UpdateChatbotBody = Chatbot.pick({
  name: true,
  description: true,
  status: true,
});
export const DeleteChatbotResponse = z.undefined();

export const ChatbotModel = new Elysia().model({
  Chatbot,
  CreateChatbotBody,
  OneChatbotResponse,
  ManyChatbotResponse,
  OneChatbotParams,
  UpdateChatbotBody,
  DeleteChatbotResponse,
  OneSmallChatbotResponse,
});
