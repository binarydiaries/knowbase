// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from "vite";

const {LANDING_URL} = loadEnv(process.env.NODE_ENV, process.cwd(), "");

// https://astro.build/config
export default defineConfig({
  site: LANDING_URL,
  outputDir: 'static',
  integrations: [sitemap(), mdx()],

  vite: {
    plugins: [tailwindcss()]
  }
});