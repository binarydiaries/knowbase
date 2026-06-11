import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { intentActions } from '../../db/schema/intentActions';
import { intents } from '../../db/schema/intents';

type CreateIntentInput = typeof intents.$inferInsert;
type CreateActionInput = Omit<typeof intentActions.$inferInsert, 'intentId'>;

export abstract class IntentService {
  static listWithActions(agentId: string) {
    return db.query.intents.findMany({
      where: { agentId },
      with: { actions: { orderBy: (a) => a.order } },
    });
  }

  static singleWithActions({ id, orgId }: { id: string; orgId: string }) {
    return db.query.intents.findFirst({
      where: { id, agent: { orgId } },
      with: { actions: { orderBy: (a) => a.order } },
    });
  }

  static async create(data: CreateIntentInput, actions: CreateActionInput[]) {
    return db.transaction(async (tx) => {
      const [intent] = await tx.insert(intents).values(data).returning();
      const actionRows = actions.length
        ? await tx
            .insert(intentActions)
            .values(actions.map((a) => ({ ...a, intentId: intent.id })))
            .returning()
        : [];
      return { ...intent, actions: actionRows };
    });
  }

  static async update(
    id: string,
    data: Partial<CreateIntentInput>,
    actions?: CreateActionInput[],
  ) {
    return db.transaction(async (tx) => {
      const [intent] = await tx
        .update(intents)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(intents.id, id))
        .returning();

      if (actions !== undefined) {
        // Replace all actions atomically
        await tx
          .delete(intentActions)
          .where(eq(intentActions.intentId, id));
        const actionRows = actions.length
          ? await tx
              .insert(intentActions)
              .values(actions.map((a) => ({ ...a, intentId: id })))
              .returning()
          : [];
        return { ...intent, actions: actionRows };
      }

      const existingActions = await tx.query.intentActions.findMany({
        where: { intentId: id },
        orderBy: (a) => a.order,
      });
      return { ...intent, actions: existingActions };
    });
  }

  static async delete(id: string) {
    const rows = await db
      .delete(intents)
      .where(eq(intents.id, id))
      .returning();
    return rows[0];
  }
}
