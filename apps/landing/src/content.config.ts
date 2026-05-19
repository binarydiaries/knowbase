import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    author: z.string(),
    authorRole: z.string().optional(),
    excerpt: z.string(),
    tags: z.array(z.string()),
    readTime: z.string(),
    published: z.boolean().default(true),
    image: z.string().optional(),
    updatedAt: z.string().optional(), // ISO date, used as dateModified in schema
  }),
});

export const collections = { blog };
