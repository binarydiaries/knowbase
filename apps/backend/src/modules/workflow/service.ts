import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { workflowActions } from '../../db/schema/workflowActions';
import { workflows } from '../../db/schema/workflows';

type CreateWorkflowInput = typeof workflows.$inferInsert;
type CreateActionInput = Omit<typeof workflowActions.$inferInsert, 'workflowId'>;

export abstract class WorkflowService {
  static listWithActions(agentId: string) {
    return db.query.workflows.findMany({
      where: { agentId },
      with: { actions: { orderBy: (a) => a.order } },
    });
  }

  static singleWithActions({ id, orgId }: { id: string; orgId: string }) {
    return db.query.workflows.findFirst({
      where: { id, agent: { orgId } },
      with: { actions: { orderBy: (a) => a.order } },
    });
  }

  static async create(data: CreateWorkflowInput, actions: CreateActionInput[]) {
    return db.transaction(async (tx) => {
      const [workflow] = await tx.insert(workflows).values(data).returning();
      const actionRows = actions.length
        ? await tx
            .insert(workflowActions)
            .values(actions.map((a) => ({ ...a, workflowId: workflow.id })))
            .returning()
        : [];
      return { ...workflow, actions: actionRows };
    });
  }

  static async update(
    id: string,
    data: Partial<CreateWorkflowInput>,
    actions?: CreateActionInput[],
  ) {
    return db.transaction(async (tx) => {
      const [workflow] = await tx
        .update(workflows)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(workflows.id, id))
        .returning();

      if (actions !== undefined) {
        // Replace all actions atomically
        await tx
          .delete(workflowActions)
          .where(eq(workflowActions.workflowId, id));
        const actionRows = actions.length
          ? await tx
              .insert(workflowActions)
              .values(actions.map((a) => ({ ...a, workflowId: id })))
              .returning()
          : [];
        return { ...workflow, actions: actionRows };
      }

      const existingActions = await tx.query.workflowActions.findMany({
        where: { workflowId: id },
        orderBy: (a) => a.order,
      });
      return { ...workflow, actions: existingActions };
    });
  }

  static async delete(id: string) {
    const rows = await db
      .delete(workflows)
      .where(eq(workflows.id, id))
      .returning();
    return rows[0];
  }
}
