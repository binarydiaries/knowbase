// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://agenvik.com',
  outputDir: 'static',
  integrations: [sitemap(), mdx()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare()
});