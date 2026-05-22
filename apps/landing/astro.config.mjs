// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const { LANDING_URL } = loadEnv(process.env.NODE_ENV, process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  site: LANDING_URL,
  outputDir: 'static',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/dashboard/'),
    }),
    mdx(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
