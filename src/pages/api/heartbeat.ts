export const prerender = false;
import type { APIRoute } from 'astro';
import { json, ok, unauthorized, serverError } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { resolveEnv } from '@/lib/supabase/env';

// Keep-alive endpoint. Two callers:
//   1. Cloudflare Cron / external cron — must present X-Cron-Secret. Uses the
//      service-role client (no user session) to call the heartbeat() RPC.
//   2. The dashboard "Ping now" button — an authenticated admin/editor; uses
//      their RLS-scoped client.
// Either way the result is an INSERT into activity_log, which resets Supabase's
// free-tier inactivity timer.

export const POST: APIRoute = async ({ request, locals }) => {
  const env = resolveEnv(locals.runtime?.env as Record<string, string> | undefined);
  const provided = request.headers.get('x-cron-secret');
  const fromDashboard = request.headers.get('x-source') === 'dashboard';

  // Cron path: verify the shared secret, use service role.
  if (provided) {
    if (!env.CRON_SECRET || provided !== env.CRON_SECRET) return unauthorized('Bad cron secret');
    const admin = createSupabaseAdmin(locals.runtime?.env as Record<string, string> | undefined);
    const { error } = await admin.rpc('heartbeat');
    if (error) return serverError(error.message);
    return ok({ at: new Date().toISOString() });
  }

  // Dashboard path: must be an authenticated admin/editor.
  if (fromDashboard) {
    if (!locals.user || !locals.role) return unauthorized();
    const { error } = await locals.supabase.rpc('heartbeat');
    if (error) return serverError(error.message);
    return ok({ at: new Date().toISOString() });
  }

  return unauthorized('Missing X-Cron-Secret');
};

// Allow GET for simple external cron services (cron-job.org) that only do GET.
export const GET: APIRoute = async ({ request, locals }) => {
  const env = resolveEnv(locals.runtime?.env as Record<string, string> | undefined);
  const provided = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  if (!env.CRON_SECRET || provided !== env.CRON_SECRET) return unauthorized('Bad cron secret');
  const admin = createSupabaseAdmin(locals.runtime?.env as Record<string, string> | undefined);
  const { error } = await admin.rpc('heartbeat');
  if (error) return serverError(error.message);
  return json({ ok: true, at: new Date().toISOString() });
};
