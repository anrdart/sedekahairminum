// Custom Cloudflare Worker entry. Reuses Astro's default SSR entrypoint to build
// the `fetch` handler, then adds a `scheduled` handler for the Cron Trigger
// (wrangler.jsonc → triggers.crons). The cron fires the keep-alive: it POSTs
// /api/heartbeat with the CRON_SECRET so the exact same code path (and activity
// log row) runs as an external cron would.
//
// Wired via astro.config.mjs → adapter `workerEntryPoint: { path: 'src/worker.ts' }`.
// Astro calls the exported `createExports(manifest)` to assemble the Worker.

import { createExports as createDefaultExports } from '@astrojs/cloudflare/entrypoints/server.js';

interface Env {
  CRON_SECRET?: string;
  [key: string]: unknown;
}
type ScheduledController = { scheduledTime: number; cron: string };
type ExecutionContext = { waitUntil(p: Promise<unknown>): void; passThroughOnException?(): void };
type FetchHandler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

export function createExports(manifest: unknown) {
  const make = createDefaultExports as unknown as (m: unknown) => { default: { fetch: FetchHandler } };
  const base = make(manifest);
  const fetch = base.default.fetch;

  const scheduled = async (_controller: ScheduledController, env: Env, ctx: ExecutionContext) => {
    const req = new Request('https://internal/api/heartbeat', {
      method: 'POST',
      headers: { 'x-cron-secret': env.CRON_SECRET ?? '' },
    });
    ctx.waitUntil(
      fetch(req, env, ctx).catch((err: unknown) => {
        console.error('[cron] heartbeat failed', err);
      }),
    );
  };

  return { default: { fetch, scheduled } };
}
