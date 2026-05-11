import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts'

export async function GET(context) {
  const posts = await getCollection('blog')
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts
      .filter((p) => p.data.published)
      .map((post) => ({
        title: post.data.title,
        description: post.data.excerpt,
        pubDate: new Date(post.data.date),
        link: `/blog/${post.id}/`,
      })),
  })
}
