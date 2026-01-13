import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'KnowBaseEmbed',
      formats: ['iife'],
      fileName: () => 'embed.js',
    },
    // minify: 'terser',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
