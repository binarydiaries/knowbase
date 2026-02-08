import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import { z } from 'zod';
import type * as schemas from 'zod/src/v4/core/schemas';
import { Behaviour } from './modules/behaviour/behaviour';
import { Channel } from './modules/channel/channel';
import { Chat } from './modules/chat/chat';
import { Chatbot } from './modules/chatbot/chatbot';
import { Conversation } from './modules/conversation/conversation';
import { Document } from './modules/document/document';
import { Embedding } from './modules/embedding/embedding';
import { message } from './modules/message/message';

const app = new Elysia()
  .use(
    openapi({
      path: '/docs',
      mapJsonSchema: {
        zod: (schema: schemas.$ZodType) =>
          z.toJSONSchema(schema, {
            unrepresentable: 'any',
            target: 'openapi-3.0',
            override: (ctx) => {
              const def = ctx.zodSchema._zod.def;
              if (def.type === 'date') {
                ctx.jsonSchema.type = 'string';
                ctx.jsonSchema.format = 'date-time';
              }
            },
          }),
      },
      documentation: {
        info: {
          title: 'Knowbase Documentation',
          version: '1.0.0',
        },
      },
    }),
  )
  .use(cors())
  .use(Chat)
  .use(message)
  .use(Document)
  .use(Chatbot)
  .use(Embedding)
  .use(Conversation)
  .use(Behaviour)
  .use(Channel)
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
