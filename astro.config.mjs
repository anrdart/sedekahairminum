import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const EDGE_SERVER = require.resolve('react-dom/server.edge');

// Vite plugin: react-dom/server → edge build ONLY during build. The edge build
// uses ReadableStream (no MessageChannel) which Workers need. In dev, the
// default node build works fine (Vite dev runs under Node, not workerd).
function reactDomEdge() {
  return {
    name: 'react-dom-edge',
    enforce: 'pre',
    apply: 'build',
    resolveId(source) {
      if (source === 'react-dom/server' || source === 'react-dom/server.browser') {
        return EDGE_SERVER;
      }
    },
  };
}

export default defineConfig({
  site: 'https://sedekahairminum.com',
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'compile',
    workerEntryPoint: {
      path: 'src/worker.ts',
    },
  }),
  integrations: [sitemap(), react()],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  vite: {
    plugins: [tailwindcss(), reactDomEdge()],
    build: {
      chunkSizeWarningLimit: 1200,
    },
    ssr: {
      external: ['@supabase/supabase-js', '@supabase/ssr'],
    },
  },
});
