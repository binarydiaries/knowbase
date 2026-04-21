import { eq } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '../../db';
import { documents, type IDocument } from '../../db/schema/documents';
import type { DocumentSchema } from './model';

export abstract class DocumentService {
  static async create(data: typeof documents.$inferInsert) {
    const [doc] = await db.insert(documents).values(data).returning();
    return doc;
  }

  static async list({
    agentId,
    orgId,
    filter,
  }: {
    agentId: string;
    orgId: string;
    filter?: {
      status?: IDocument['status'][];
    };
  }) {
    return db.query.documents.findMany({
      where: {
        agentId,
        agent: {
          orgId,
        },
        ...(filter?.status ? { status: { in: filter.status } } : {}),
      },
    });
  }

  static async single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.documents.findFirst({
      where: {
        id,
        agent: {
          orgId,
        },
      },
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

  static async delete(id: string) {
    const [deletedDoc] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();

    return deletedDoc;
  }

  static transformDocument(
    doc: typeof documents.$inferSelect,
  ): z.infer<typeof DocumentSchema> {
    return {
      ...doc,
      content: {
        // biome-ignore lint/suspicious/noExplicitAny: This is difficult to type
        data: doc.contentSerialized as any,
        type: doc.type,
      },
    };
  }
}
