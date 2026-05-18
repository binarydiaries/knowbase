import { Elysia } from 'elysia';
import { z } from 'zod';
import { AdminGuard } from '../../common/authGuard/adminGuard';
import { DemoBookingService } from '../demo/service';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const AdminDemoBookings = new Elysia({
  prefix: '/admin/demo-bookings',
  tags: ['Admin'],
})
  .use(AdminGuard)
  .get('/', async ({ query }) => {
    const { page, limit } = QuerySchema.parse(query);
    return DemoBookingService.list({ page, limit });
  });
