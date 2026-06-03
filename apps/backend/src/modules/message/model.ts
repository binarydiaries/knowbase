import { Elysia } from 'elysia';
import { z } from 'zod';
import {
  MessageMetaData,
  MessageSchema,
  MessageSystemMetaData,
} from '@knowbase/models/schemas';

export { MessageMetaData, MessageSchema, MessageSystemMetaData };

const ManyMessageResponse = z.object({
  messages: z.array(MessageSchema),
});

export const MessageModel = new Elysia().model({
  MessageSchema,
  ManyMessageResponse,
});
