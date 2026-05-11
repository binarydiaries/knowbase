import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    author: z.string(),
    authorRole: z.string().optional(),
    excerpt: z.string(),
    tags: z.array(z.string()),
    readTime: z.string(),
    published: z.boolean().default(true),
  }),
})

export const collections = { blog }
