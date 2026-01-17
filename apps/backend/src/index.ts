import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import { z } from 'zod';
import type * as schemas from 'zod/src/v4/core/schemas';
import { Chat } from './modules/chat/chat';
import { Chatbot } from './modules/chatbot/chatbot';
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
  .listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
