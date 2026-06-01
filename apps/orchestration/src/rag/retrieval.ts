import { OpenAIEmbeddings } from '@langchain/openai';
import { and, cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents, embeddings } from '../db/schema.js';
import type { RagChunk } from '../graph/state.js';

const embeddingModel = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
});

export async function embedQuery(query: string): Promise<{ embedding: number[]; tokens: number }> {
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
export async function similaritySearch(
  query: string,
  agentId: string,
): Promise<RagChunk[]> {
  const { embedding } = await embedQuery(query);

  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, embedding)})`;

  const selectFields = {
    similarity,
    content: embeddings.content,
    documentId: embeddings.documentId,
    documentVersion: embeddings.documentVersion,
    chunkIndex: embeddings.chunkIndex,
  };

  const agentFilter = eq(documents.agentId, agentId);

  const primary = await db
    .select(selectFields)
    .from(embeddings)
    .innerJoin(documents, eq(embeddings.documentId, documents.id))
    .where(and(gt(similarity, 0.35), agentFilter))
    .orderBy(desc(similarity))
    .limit(5);

  if (primary.length > 0) return primary as RagChunk[];

  const fallback = await db
    .select(selectFields)
    .from(embeddings)
    .innerJoin(documents, eq(embeddings.documentId, documents.id))
    .where(and(gt(similarity, 0.2), agentFilter))
    .orderBy(desc(similarity))
    .limit(3);

  return fallback as RagChunk[];
}

export function computeConfidenceScore(chunks: RagChunk[]): number {
  if (!chunks.length) return 0;
  return chunks.reduce((acc, c) => acc + c.similarity, 0) / chunks.length;
}
