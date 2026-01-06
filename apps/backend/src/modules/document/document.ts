import { Elysia } from 'elysia';
import { z } from 'zod';
import { DocumentService } from './service';

export const Document = new Elysia({ prefix: 'documents', tags: ['Documents'] })
  .get('', () => {})
  .post(
    '',
    ({ body }) => {
      return DocumentService.create(body.content);
    },
    {
      body: z.object({
        content: z.string(),
      }),
    },
  );
