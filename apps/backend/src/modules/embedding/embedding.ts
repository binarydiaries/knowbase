import { Elysia } from 'elysia';
import { EmbeddingModel } from './model';
import { EmbeddingService } from './service';

export const Embedding = new Elysia({
  prefix: '/embedding',
  tags: ['Embedding'],
})
  .use(EmbeddingModel)
  .post(
    '',
    async ({ body, status }) => {
      await EmbeddingService.startEmbedding(body.chatbotId);
      return status(202, {
        message: 'Indexing Started',
      });
    },
    {
      body: 'EmbedStartBody',
      202: 'EmbedStartResponse',
    },
  );
