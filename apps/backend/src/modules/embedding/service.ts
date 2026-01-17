import { openai } from '@ai-sdk/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { embed, embedMany } from 'ai';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { db } from '../../db';
import { embeddings } from '../../db/schema';

const model = openai.embedding('text-embedding-3-small');

export abstract class EmbeddingService {
  static startEmbedding = async (chatbotId: string) => {};

  static generateChunks = async (input: string): Promise<string[]> => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 400,
      chunkOverlap: 50,
    });
    return await splitter.splitText(input);
  };

  static generateEmbeddings = async (
    value: string,
  ): Promise<Array<{ embedding: number[]; content: string }>> => {
    const chunks = await this.generateChunks(value);
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
      .select({ name: embeddings.content, similarity })
      .from(embeddings)
      .where(gt(similarity, 0.5))
      .orderBy((t) => desc(t.similarity))
      .limit(4);
  };
}
