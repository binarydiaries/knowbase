import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  type: 'content',
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
