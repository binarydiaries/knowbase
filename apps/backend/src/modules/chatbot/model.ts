import { Elysia } from 'elysia';
import { z } from 'zod';
import { BehaviourSchema } from '../behaviour/model';
import { ChannelSchema } from '../channel/model';
import { DocumentSchema } from '../document/model';
import { SubscriptionStatusSchema } from '../subscription/model';

const ChatbotStatus = z.enum(['active', 'archived']);

const ChatbotSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  chatbotStatus: ChatbotStatus,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const SmallChatbot = ChatbotSchema.pick({
  id: true,
  name: true,
  description: true,
  chatbotStatus: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

const SmallChatbotWithLock = SmallChatbot.extend({
  locked: z.boolean(),
});

const ChatbotWithLock = ChatbotSchema.extend({
  locked: z.boolean(),
});

const CreateChatbotBody = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const OneChatbotResponse = z.object({
  chatbot: ChatbotWithLock,
  documents: z.array(DocumentSchema),
  channels: z.array(ChannelSchema),
  behaviour: BehaviourSchema.optional(),
  subscription: SubscriptionStatusSchema,
});

const OneSmallChatbotResponse = z.object({
  chatbot: SmallChatbot,
});

const ManyChatbotResponse = z.object({
  chatbots: z.array(SmallChatbotWithLock),
  subscription: SubscriptionStatusSchema,
});

export const UpdateChatbotBody = ChatbotSchema.pick({
  name: true,
  description: true,
  chatbotStatus: true,
}).partial();
export const DeleteChatbotResponse = z.undefined();

export const ChatbotModel = new Elysia().model({
  ChatbotSchema,
  CreateChatbotBody,
  OneChatbotResponse,
  ManyChatbotResponse,
  UpdateChatbotBody,
  DeleteChatbotResponse,
  OneSmallChatbotResponse,
});
