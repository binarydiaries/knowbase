import { openai } from '@ai-sdk/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { embed, embedMany } from 'ai';
import { cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '../../db';
import { documents } from '../../db/schema/documents';
import { embeddings } from '../../db/schema/embeddings';
import { MarkdownHeaderTextSplitter } from '../../utils/MarkdownHeaderTextSplitter';
import type { DocumentContent, DocumentContentQna } from '../document/model';
import { DocumentService } from '../document/service';

const model = openai.embedding('text-embedding-3-small');

const splitter = new MarkdownHeaderTextSplitter([
  ['#', 'h1'],
  ['##', 'h2'],
  ['###', 'h3'],
]);

export abstract class EmbeddingService {
  static embedDocument = async (document: typeof documents.$inferSelect) => {
    return await db.transaction(async (transaction) => {
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
      } else if (documentContent.type === 'text') {
        const chunks = await EmbeddingService.chunkText({
          title: document.title,
          content: documentContent.data,
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

  static async chunkText({
    title,
    content,
  }: {
    title: string;
    content: string;
  }) {
    const documentChunks = splitter.splitText(content);
    const documentChunkPromise = documentChunks.map(async (doc) => {
      const headerString = Object.values(doc.metadata).join(' → ');
      const header = title + (headerString ? ` - ${headerString}` : '');

      const recursiveChunks = await EmbeddingService.generateRecursiveChunks(
        doc.pageContent,
      );

      return recursiveChunks.map((recursiveChunk, index) => {
        return `${header} (part ${index + 1}/${recursiveChunks.length})

${recursiveChunk}
      `.trim();
      });
    });

    return (await Promise.all(documentChunkPromise)).flat();
  }

  static startEmbedding = async (chatbotId: string) => {
    const documents = await DocumentService.list({ chatbotId });
    return Promise.all(
      documents
        .filter(
          (document) =>
            document.status === 'draft' || document.status === 'ready',
        )
        .map(async (document) => {
          return await this.embedDocument(document);
        }),
    );
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
