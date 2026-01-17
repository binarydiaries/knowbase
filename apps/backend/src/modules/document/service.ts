import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { documents, embeddings as embeddingsTable } from '../../db/schema';

export abstract class DocumentService {
  static async create(data: typeof documents.$inferInsert) {
    const [doc] = await db.insert(documents).values(data).returning();
    return doc;
  }
  // static async createV1(data: typeof documents.$inferInsert) {
  //   const [document] = await db.transaction(async (transaction) => {
  //     const [doc] = await transaction
  //       .insert(documents)
  //       .values(data)
  //       .returning();
  //
  //     const embeddings = await EmbeddingService.generateEmbeddings(
  //       data.content,
  //     );
  //     await transaction.insert(embeddingsTable).values(
  //       embeddings.map((embedding) => ({
  //         documentId: doc.id,
  //         content: embedding.content,
  //         embedding: embedding.embedding,
  //       })),
  //     );
  //
  //     return [doc];
  //   });
  //
  //   return document;
  // }

  static list({ chatbotId }: { chatbotId: string }) {
    return db
      .select()
      .from(documents)
      .where(eq(documents.chatbotId, chatbotId));
  }

  static single(id: string) {
    return db.query.documents.findFirst({
      where: eq(documents.id, id),
    });
  }

  static async update(
    id: string,
    data: Partial<typeof documents.$inferInsert>,
  ) {
    const [updatedDoc] = await db
      .update(documents)
      .set(data)
      .where(eq(documents.id, id))
      .returning();

    return updatedDoc;
  }

  // static async updateV1(
  //   id: string,
  //   data: Partial<typeof documents.$inferInsert>,
  // ) {
  //   return db.transaction(async (transaction) => {
  //     // Update document content
  //     const [updatedDoc] = await transaction
  //       .update(documents)
  //       .set({ content, updatedAt: new Date() })
  //       .where(eq(documents.id, id))
  //       .returning();
  //
  //     // Delete existing embeddings
  //     await transaction
  //       .delete(embeddingsTable)
  //       .where(eq(embeddingsTable.documentId, id));
  //
  //     // Generate and insert new embeddings
  //     const embeddings = await EmbeddingService.generateEmbeddings(content);
  //     await transaction.insert(embeddingsTable).values(
  //       embeddings.map((embedding) => ({
  //         documentId: id,
  //         content: embedding.content,
  //         embedding: embedding.embedding,
  //       })),
  //     );
  //
  //     return updatedDoc;
  //   });
  // }

  static async delete(id: string) {
    return db.transaction(async (transaction) => {
      // Delete embeddings first due to foreign key constraint
      await transaction
        .delete(embeddingsTable)
        .where(eq(embeddingsTable.documentId, id));

      // Then delete the document
      const [deletedDoc] = await transaction
        .delete(documents)
        .where(eq(documents.id, id))
        .returning();

      return deletedDoc;
    });
  }
}
