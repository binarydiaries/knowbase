import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import { z } from 'zod';
import type * as schemas from 'zod/src/v4/core/schemas';
import { chat } from './modules/chat/chat';
import { Chatbot } from './modules/chatbot/chatbot';
import { document } from './modules/document/document';
import { message } from './modules/message/message';

const app = new Elysia()
  .use(
    openapi({
      path: '/docs',
      mapJsonSchema: {
        zod: (schema: schemas.$ZodType) => {
          return z.toJSONSchema(schema, {
            unrepresentable: 'any',
            override: (ctx) => {
              const def = ctx.zodSchema._zod.def;
              if (def.type === 'date') {
                ctx.jsonSchema.type = 'string';
                ctx.jsonSchema.format = 'date-time';
              }
            },
          });
        },
      },
    }),
  )
  .use(cors())
  .get('/health', () => {
    return {
      status: 'ok',
      service: 'knowbase',
      time: new Date().toISOString(),
    };
  })
  .use(chat)
  .use(message)
  .use(document)
  .use(Chatbot)
  .listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
