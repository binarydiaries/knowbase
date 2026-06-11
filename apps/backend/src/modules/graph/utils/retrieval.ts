import { OpenAIEmbeddings } from '@langchain/openai';
import { and, cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '../../../db';
import { documents } from '../../../db/schema/documents';
import { embeddings } from '../../../db/schema/embeddings';
import type { RagChunkSchema } from '../state';

const embeddingModel = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
});

export async function embedQuery(
  query: string,
): Promise<{ embedding: number[]; tokens: number }> {
  const normalized = query.replaceAll('\n', ' ').trim();
  const result = await embeddingModel.embedQuery(normalized);
  return { embedding: result, tokens: 0 }; // token count not exposed by LangChain embeddings
}

/**
 * Similarity search against the embeddings table.
 * Mirrors IndexingService.findRelevantContent from the backend:
 *   - primary threshold: 0.35, limit 5
 *   - fallback threshold: 0.20, limit 3
 */
export async function similaritySearch(query: string, agentId: string) {
  const { embedding } = await embedQuery(query);

  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, embedding)})`;

  const selectFields = {
    similarity,
    content: embeddings.content,
    documentId: embeddings.documentId,
    documentVersion: embeddings.documentVersion,
    chunkIndex: embeddings.chunkIndex,
  };

  // Filter by agentId only — status filter was too aggressive and excluded
  // documents that have valid embeddings but aren't currently in 'indexed' status
  // (e.g. after an edit they revert to 'ready'). Embeddings are always valid
  // for search if they exist; stale chunks are a separate concern.
  const baseFilter = eq(documents.agentId, agentId);

  const primary = await db
    .select(selectFields)
    .from(embeddings)
    .innerJoin(documents, eq(embeddings.documentId, documents.id))
    .where(and(gt(similarity, 0.35), baseFilter))
    .orderBy(desc(similarity))
    .limit(5);

  if (primary.length > 0) return primary;

  return db
    .select(selectFields)
    .from(embeddings)
    .innerJoin(documents, eq(embeddings.documentId, documents.id))
    .where(and(gt(similarity, 0.2), baseFilter))
    .orderBy(desc(similarity))
    .limit(3);
}

export function computeConfidenceScore(
  chunks: z.infer<typeof RagChunkSchema>[],
): number {
  if (!chunks.length) return 0;
  return chunks.reduce((acc, c) => acc + c.similarity, 0) / chunks.length;
}
