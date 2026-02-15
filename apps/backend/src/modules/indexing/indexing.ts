import { Elysia } from 'elysia';
import { AuthGuard } from '../../common/authGuard/authGuard';
import { IndexingModel } from './model';
import { EmbeddingService } from './service';

export const Indexing = new Elysia({
  prefix: '/indexing',
  tags: ['Indexing'],
})
  .use(AuthGuard)
  .use(IndexingModel)
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
      body: 'IndexingStartBody',
      202: 'IndexingStartResponse',
    },
  );
