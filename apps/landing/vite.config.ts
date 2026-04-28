import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

/**
 * Blocks crawlers on non-production builds:
 *   - Rewrites <meta name="robots"> in index.html to "noindex, nofollow"
 *   - Emits a robots.txt with "Disallow: /" so crawlers that ignore meta tags also stop
 *
 * Set VITE_ENV=production in your production build to enable indexing.
 */
function seoBlockPlugin(): Plugin {
  const isProduction = process.env.VITE_ENV === 'production';

  return {
    name: 'seo-block',

    // Rewrite the meta robots tag in index.html
    transformIndexHtml(html) {
      if (isProduction) return html;
      return html.replace(
        /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/,
        '<meta name="robots" content="noindex, nofollow" />',
      );
    },

    // Emit robots.txt that blocks all crawlers on staging
    generateBundle() {
      if (isProduction) return;
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: 'User-agent: *\nDisallow: /\n',
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    seoBlockPlugin(),
  ],
});
