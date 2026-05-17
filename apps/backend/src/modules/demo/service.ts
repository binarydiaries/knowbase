import { count, desc } from 'drizzle-orm';
import { db } from '../../db';
import { demoBookings } from '../../db/schema/demoBookings';

export abstract class DemoBookingService {
  static async create(data: {
    name: string;
    email: string;
    company: string;
    phone?: string;
    category?: string;
    message?: string;
  }) {
    const [row] = await db.insert(demoBookings).values(data).returning();
    return row;
  }

  static async list({ page, limit }: { page: number; limit: number }) {
    const offset = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(demoBookings)
        .orderBy(desc(demoBookings.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(demoBookings),
    ]);
    return { rows, total: Number(total), page, limit };
  }
}
