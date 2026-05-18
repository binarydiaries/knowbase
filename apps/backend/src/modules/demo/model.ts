import { Elysia } from 'elysia';
import { z } from 'zod';

const DEMO_CATEGORIES = [
  'Customer Support',
  'E-commerce',
  'HR & Internal Tools',
  'Sales & Lead Generation',
  'Healthcare',
  'Education',
  'Real Estate',
  'Other',
] as const;

export const CreateDemoBookingSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().min(1).max(200),
  phone: z.string().max(30).optional(),
  category: z.enum(DEMO_CATEGORIES).optional(),
  message: z.string().max(2000).optional(),
  captchaToken: z.string().min(1),
});

export const DemoBookingModel = new Elysia().model({
  CreateDemoBookingSchema,
});
