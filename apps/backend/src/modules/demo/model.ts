import { Elysia } from 'elysia';
import { z } from 'zod';

export const CreateDemoBookingSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().min(1).max(200),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
});

export const DemoBookingModel = new Elysia().model({
  CreateDemoBookingSchema,
});
