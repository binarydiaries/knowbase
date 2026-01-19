import { openai } from '@ai-sdk/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { embed, embedMany } from 'ai';
import { cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '../../db';
import { documents, embeddings } from '../../db/schema';
import type { DocumentContent, DocumentContentQna } from '../document/model';
import { DocumentService } from '../document/service';

const model = openai.embedding('text-embedding-3-small');

export abstract class EmbeddingService {
  static embedDocument = async (document: typeof documents.$inferSelect) => {
    await db.transaction(async (transaction) => {
      await transaction
        .update(documents)
        .set({
          status: 'indexing',
        })
        .where(eq(documents.id, document.id));

      const documentContent = {
        type: document.type,
        data: document.contentSerialized,
      } as z.infer<typeof DocumentContent>;

      let generatedEmbeddings: { embedding: number[]; content: string }[] = [];
      if (documentContent.type === 'qna') {
        const chunks = await EmbeddingService.chunkLargeQnA({
          title: document.title,
          questions: documentContent.data,
        });
        generatedEmbeddings = await EmbeddingService.generateEmbeddings(chunks);
      }

      if (generatedEmbeddings.length > 0) {
        await transaction.insert(embeddings).values(
          generatedEmbeddings.map((embedding, chunkIndex) => ({
            documentId: document.id,
            documentVersion: document.version,
            chunkIndex,
            content: embedding.content,
            embedding: embedding.embedding,
          })),
        );
        await transaction
          .update(documents)
          .set({
            status: 'indexed',
            lastIndexedVersion: document.version,
          })
          .where(eq(documents.id, document.id));
      }
    });
  };

  static async chunkLargeQnA({
    title,
    questions,
  }: {
    title: string;
    questions: z.infer<typeof DocumentContentQna>;
  }) {
    const chunkPromises = questions.map(async (question) => {
      const recursiveChunks = await EmbeddingService.generateRecursiveChunks(
        question.answer,
      );

      return recursiveChunks.map((chunk, index) => {
        return `
Title: ${title}

Question: ${question.question}
Answer (part ${index + 1}/${recursiveChunks.length}):
${chunk}
        `.trim();
      });
    });

    return (await Promise.all(chunkPromises)).flat();
  }

  static startEmbedding = async (chatbotId: string) => {
    const documents = await DocumentService.list({ chatbotId });
    documents.forEach((document) => {
      this.embedDocument(document);
    });
  };

  static generateRecursiveChunks = async (input: string): Promise<string[]> => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 400,
      chunkOverlap: 50,
    });
    return await splitter.splitText(input);
  };

  static generateEmbeddings = async (
    chunks: string[],
  ): Promise<Array<{ embedding: number[]; content: string }>> => {
    const { embeddings } = await embedMany({
      model,
      values: chunks,
    });
    return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
  };

  static generateEmbedding = async (value: string): Promise<number[]> => {
    const input = value.replaceAll('\\n', ' ');
    const { embedding } = await embed({
      model,
      value: input,
    });
    return embedding;
  };

  static findRelevantContent = async (userQuery: string) => {
    const userQueryEmbedded = await this.generateEmbedding(userQuery);
    const similarity = sql<number>`1 - (${cosineDistance(
      embeddings.embedding,
      userQueryEmbedded,
    )})`;
    return db
      .select({
        similarity,
        content: embeddings.content,
        documentId: embeddings.documentId,
        documentVersion: embeddings.documentVersion,
        chunkIndex: embeddings.chunkIndex,
      })
      .from(embeddings)
      .where(gt(similarity, 0.5))
      .orderBy((t) => desc(t.similarity))
      .limit(4);
  };
}
