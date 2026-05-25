import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const isStaging = import.meta.env.PUBLIC_ENV !== 'production';

  const content = isStaging
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\n\nSitemap: https://agenvik.com/sitemap-index.xml\n\n# LLM-friendly content index\n# https://agenvik.com/llms.txt\n`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
