import { db } from '../../db';
import { embeddings as embeddingsTable } from '../../db/schema';
import { documents } from '../../db/schema/documents';
import { EmbeddingService } from '../embedding/service';

export abstract class DocumentService {
  static async create(content: string) {
    await db.transaction(async (transaction) => {
      const [document] = await transaction
        .insert(documents)
        .values({ content })
        .returning();

      const embeddings = await EmbeddingService.generateEmbeddings(content);
      await transaction.insert(embeddingsTable).values(
        embeddings.map((embedding) => ({
          documentId: document.id,
          content: embedding.content,
          embedding: embedding.embedding,
        })),
      );
    });
  }
}
