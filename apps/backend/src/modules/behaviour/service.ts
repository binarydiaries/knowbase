import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { behaviors } from '../../db/schema';

export abstract class BehaviourService {
  static single({ id, orgId }: { id: string; orgId: string }) {
    return db.query.behaviors.findFirst({
      where: { id, chatbot: { orgId } },
    });
  }

  static singleByChatbot(chatbotId: string) {
    return db.query.behaviors.findFirst({
      where: { chatbotId },
    });
  }

  static list({ orgId }: { orgId: string }) {
    return db.query.behaviors.findMany({
      where: { chatbot: { orgId } },
    });
  }

  static async update(
    id: string,
    data: Partial<typeof behaviors.$inferInsert>,
  ) {
    const rows = await db
      .update(behaviors)
      .set(data)
      .where(eq(behaviors.id, id))
      .returning();
    return rows[0];
  }
}
