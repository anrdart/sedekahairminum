export const prerender = false;
import type { APIRoute } from 'astro';
import { json, ok, unauthorized, serverError } from '@/lib/api';
import { safeEqual } from '@/lib/security';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { resolveEnv } from '@/lib/supabase/env';

// Keep-alive endpoint. Two callers:
//   1. Cloudflare Cron / external cron — must present X-Cron-Secret header.
//      Uses the service-role client (no user session) to call heartbeat() RPC.
//   2. The dashboard "Ping now" button — an authenticated admin/editor; uses
//      their RLS-scoped client.
// Either way the result is an INSERT into activity_log, which resets Supabase's
// free-tier inactivity timer.

async function verifyCron(request: Request, locals: any): Promise<Response | null> {
  const env = resolveEnv(locals.runtime?.env as Record<string, string> | undefined);
  const provided = request.headers.get('x-cron-secret') ?? '';
  if (!env.CRON_SECRET || !provided || !safeEqual(provided, env.CRON_SECRET)) {
    return unauthorized('Bad cron secret');
  }
  return null;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const provided = request.headers.get('x-cron-secret');
  const fromDashboard = request.headers.get('x-source') === 'dashboard';

  if (provided) {
    const err = await verifyCron(request, locals);
    if (err) return err;
    const admin = createSupabaseAdmin(locals.runtime?.env as Record<string, string> | undefined);
    const { error } = await admin.rpc('heartbeat');
    if (error) return serverError(error.message);
    return ok({ at: new Date().toISOString() });
  }

  if (fromDashboard) {
    if (!locals.user || !locals.role) return unauthorized();
    const { error } = await locals.supabase.rpc('heartbeat');
    if (error) return serverError(error.message);
    return ok({ at: new Date().toISOString() });
  }

  return unauthorized('Missing X-Cron-Secret');
};

// GET variant: ONLY accepts the secret via header. Query-string secret
// deliberately rejected — query strings land in access logs, browser history,
// and Referer headers, leaking the secret.
export const GET: APIRoute = async ({ request, locals }) => {
  const err = await verifyCron(request, locals);
  if (err) return err;
  const admin = createSupabaseAdmin(locals.runtime?.env as Record<string, string> | undefined);
  const { error } = await admin.rpc('heartbeat');
  if (error) return serverError(error.message);
  return json({ ok: true, at: new Date().toISOString() });
};
