import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// Hybrid: `output: 'static'` keeps marketing pages prerendered (fast, SEO).
// Routes that `export const prerender = false` (blog, /admin, /api) render
// on-demand via the Cloudflare adapter. Pinned to adapter v12 because
// Astro 6 + adapter v13 hybrid is currently broken (withastro/astro#15237).
export default defineConfig({
  site: 'https://sedekahairminum.com',
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: true }, // exposes Astro.locals.runtime.env in `astro dev`
    imageService: 'compile',          // keep Astro asset pipeline at build time
    workerEntryPoint: {
      path: 'src/worker.ts',          // adds the scheduled() cron handler for keep-alive
    },
  }),
  integrations: [sitemap(), react()],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 1200,
    },
    ssr: {
      external: ['@supabase/supabase-js', '@supabase/ssr'],
    },
    resolve: {
      alias: [
        // Force react-dom/server to the edge build (no MessageChannel).
        // The browser build requires Node-only globals that Workers lack.
        { find: 'react-dom/server', replacement: 'react-dom/server.edge' },
      ],
    },
  },
});
