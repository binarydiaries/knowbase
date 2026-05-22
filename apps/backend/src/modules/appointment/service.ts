import { db } from '../../db';
import { appointments } from '../../db/schema/appointments';

export abstract class AppointmentService {
  static async create(data: typeof appointments.$inferInsert) {
    const rows = await db.insert(appointments).values(data).returning();
    return rows[0];
  }
}
