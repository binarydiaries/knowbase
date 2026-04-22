import { openai } from '@ai-sdk/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { embed, embedMany } from 'ai';
import { and, cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '../../db';
import { documents } from '../../db/schema/documents';
import { embeddings } from '../../db/schema/embeddings';
import { MarkdownHeaderTextSplitter } from '../../utils/MarkdownHeaderTextSplitter';
import type { DocumentContent, DocumentContentQna } from '../document/model';

const model = openai.embedding('text-embedding-3-small');

const splitter = new MarkdownHeaderTextSplitter([
  ['#', 'h1'],
  ['##', 'h2'],
  ['###', 'h3'],
]);

// Sentence-level separators give the splitter natural break points before it
// falls back to splitting mid-word. Order matters: prefer coarser breaks first.
const RECURSIVE_SEPARATORS = ['\n\n', '\n', '. ', '! ', '? ', '; ', ' ', ''];

// 800 chars gives enough context for a meaningful embedding while staying well
// under the token limit for text-embedding-3-small. 100-char overlap preserves
// continuity across adjacent chunks without duplicating too much content.
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

export abstract class IndexingService {
  static embedDocument = async (document: typeof documents.$inferSelect) => {
    const documentContent = {
      type: document.type,
      data: document.contentSerialized,
    } as z.infer<typeof DocumentContent>;

    let generatedEmbeddings: { embedding: number[]; content: string }[] = [];

    if (documentContent.type === 'qna') {
      const chunks = await IndexingService.chunkQnA({
        title: document.title,
        questions: documentContent.data,
      });
      generatedEmbeddings = await IndexingService.generateEmbeddings(chunks);
    } else if (documentContent.type === 'text') {
      const chunks = await IndexingService.chunkText({
        title: document.title,
        content: documentContent.data,
      });
      generatedEmbeddings = await IndexingService.generateEmbeddings(chunks);
    }

    if (generatedEmbeddings.length > 0) {
      await db.insert(embeddings).values(
        generatedEmbeddings.map((embedding, chunkIndex) => ({
          documentId: document.id,
          documentVersion: document.version,
          chunkIndex,
          content: embedding.content,
          embedding: embedding.embedding,
        })),
      );
    }
  };

  static async chunkQnA({
    title,
    questions,
  }: {
    title: string;
    questions: z.infer<typeof DocumentContentQna>;
  }) {
    const chunkPromises = questions.map(async (question) => {
      // Skip recursive splitting for short answers — they read better as a
      // single chunk and produce a more precise embedding.
      const answerChunks =
        question.answer.length <= CHUNK_SIZE
          ? [question.answer]
          : await IndexingService.splitIntoChunks(question.answer);

      return answerChunks.map((chunk, index) => {
        const partSuffix =
          answerChunks.length > 1
            ? ` (part ${index + 1}/${answerChunks.length})`
            : '';

        return `Title: ${title}\n\nQuestion: ${question.question}\nAnswer${partSuffix}:\n${chunk}`.trim();
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

    const chunkPromises = documentChunks.map(async (doc) => {
      const headerString = Object.values(doc.metadata).join(' → ');
      const header = title + (headerString ? ` - ${headerString}` : '');

      const recursiveChunks = await IndexingService.splitIntoChunks(
        doc.pageContent,
      );

      return recursiveChunks.map((chunk, index) => {
        // Only append the part marker when the section was actually split —
        // "(part 1/1)" is noise and slightly degrades embedding quality.
        const partSuffix =
          recursiveChunks.length > 1
            ? ` (part ${index + 1}/${recursiveChunks.length})`
            : '';

        return `${header}${partSuffix}\n\n${chunk}`.trim();
      });
    });

    return (await Promise.all(chunkPromises)).flat();
  }

  static splitIntoChunks = async (input: string): Promise<string[]> => {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
      separators: RECURSIVE_SEPARATORS,
    });
    return textSplitter.splitText(input);
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
    // Normalise whitespace the same way as at index time so that query
    // vectors sit in the same space as document chunk vectors.
    const input = value.replaceAll('\n', ' ').trim();
    const { embedding } = await embed({
      model,
      value: input,
    });
    return embedding;
  };

  static findRelevantContent = async (userQuery: string, agentId: string) => {
    const userQueryEmbedded = await this.generateEmbedding(userQuery);
    const similarity = sql<number>`1 - (${cosineDistance(
      embeddings.embedding,
      userQueryEmbedded,
    )})`;

    const select = {
      similarity,
      content: embeddings.content,
      documentId: embeddings.documentId,
      documentVersion: embeddings.documentVersion,
      chunkIndex: embeddings.chunkIndex,
    };

    const agentFilter = eq(documents.agentId, agentId);

    // Primary search — covers precise and moderately specific queries.
    const primary = await db
      .select(select)
      .from(embeddings)
      .innerJoin(documents, eq(embeddings.documentId, documents.id))
      .where(and(gt(similarity, 0.35), agentFilter))
      .orderBy((t) => desc(t.similarity))
      .limit(5);

    if (primary.length > 0) return primary;

    // Fallback — broad/vague queries (e.g. "tell me about policy") often score
    // below the primary threshold even when highly relevant content exists.
    // Return the closest available chunks so the LLM can still attempt an
    // answer rather than always firing the fallback message.
    return db
      .select(select)
      .from(embeddings)
      .innerJoin(documents, eq(embeddings.documentId, documents.id))
      .where(and(gt(similarity, 0.2), agentFilter))
      .orderBy((t) => desc(t.similarity))
      .limit(3);
  };
}
