import { Elysia } from 'elysia';
import { z } from 'zod';
import { Behaviour } from '../behaviour/model';
import { ChannelSchema } from '../channel/model';
import { DocumentSchema } from '../document/model';

const ChatbotStatus = z.enum(['active', 'archived']);

const Chatbot = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  chatbotStatus: ChatbotStatus,
  createdBy: z.string(),
  orgId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const SmallChatbot = Chatbot.pick({
  id: true,
  name: true,
  description: true,
  chatbotStatus: true,
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
  documents: z.array(DocumentSchema),
  channels: z.array(ChannelSchema),
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
  chatbotStatus: true,
}).partial();
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
