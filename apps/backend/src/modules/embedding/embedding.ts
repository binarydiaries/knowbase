import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { EmbeddingModel } from './model';
import { EmbeddingService } from './service';

export const Embedding = new Elysia({
  prefix: '/embedding',
  tags: ['Embedding'],
})
  .use(AuthGuard)
  .use(EmbeddingModel)
  .post(
    '',
    async ({ body, status, orgId }) => {
      await EmbeddingService.startEmbedding({
        chatbotId: body.chatbotId,
        orgId,
      });

      return status(202, {
        message: 'Indexing Started',
      });
    },
    {
      body: 'EmbedStartBody',
      202: 'EmbedStartResponse',
    },
  );
