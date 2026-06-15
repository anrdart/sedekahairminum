export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { json, badRequest, serverError } from '@/lib/api';
import { rateLimit, getClientIp } from '@/lib/security';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

// Server-side login. Reasons:
// - RLS + service role give us rate limit + audit log
// - Raw Supabase auth errors don't leak to the client (account enumeration)
// - No "remember me" cookie surface — the session cookie is short-lived

const schema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1),
});

const LOGIN_RATE = { max: 5, windowMs: 15 * 60 * 1000 }; // 5 per 15 min
const PWD_RATE = { max: 3, windowMs: 60 * 1000 }; // 3 per minute (tighten after 1 fail)

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await request.json()); }
  catch (e) { return badRequest(e instanceof z.ZodError ? e.issues[0]?.message ?? 'Invalid' : 'Invalid body'); }

  const ip = getClientIp(request);
  const emailKey = body.email.toLowerCase().trim();

  // Two-tier rate limit: per-IP and per-email.
  const ipLimit = rateLimit(`ip:${ip}`, LOGIN_RATE.max, LOGIN_RATE.windowMs);
  if (!ipLimit.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Terlalu banyak percobaan. Coba lagi nanti.' }),
      { status: 429, headers: { 'content-type': 'application/json', 'retry-after': String(Math.ceil(ipLimit.resetIn / 1000)) } },
    );
  }
  const pwdLimit = rateLimit(`pwd:${emailKey}`, PWD_RATE.max, PWD_RATE.windowMs);
  if (!pwdLimit.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Terlalu banyak percobaan. Tunggu sebentar.' }),
      { status: 429, headers: { 'content-type': 'application/json', 'retry-after': String(Math.ceil(pwdLimit.resetIn / 1000)) } },
    );
  }

  // Always use the service-role client so we can:
  // - call the underlying signIn endpoint server-side (returns JWT/session)
  // - fetch the user role from profiles
  // - record audit activity
  // The actual sign-in is delegated to the browser cookie session set by
  // setSession() — we sign the user in via Supabase admin's generated link
  // pattern, or alternatively hand the session back to the client to set.
  const env = locals.runtime?.env as Record<string, string> | undefined;
  const admin = createSupabaseAdmin(env);

  // Server-side auth: use Supabase's auth API directly. We can verify the
  // password via `signInWithPassword` (using the user-scoped client) — but
  // that client is tied to the *incoming* request cookies. Instead, use the
  // admin client with `listUsers` + the built-in GoTrue HTTP API for password
  // verification by calling the auth endpoint.
  // Simplest secure path: forward to Supabase's auth API with service role
  // key (admin can sign in as any user). Use the user-scoped client for the
  // actual auth to get a proper session cookie set on the response.
  const supabaseUrl = env?.SUPABASE_URL || env?.PUBLIC_SUPABASE_URL;
  const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return serverError('Auth belum dikonfigurasi');

  let authData: { access_token: string; refresh_token: string; user: { id: string; email: string } } | null = null;
  let authError: string | null = null;
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
    if (r.ok) {
      authData = await r.json();
    } else {
      // Don't leak whether email exists. Treat every non-2xx as "invalid creds".
      authError = 'Invalid login credentials';
    }
  } catch {
    authError = 'Auth service unreachable';
  }

  if (!authData) {
    // Generic message — no enumeration.
    return new Response(
      JSON.stringify({ ok: false, error: 'Email atau kata sandi salah' }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    );
  }

  // Set the session cookie. Supabase's browser client reads a JSON-encoded
  // [access_token, refresh_token] tuple from the `sb-<ref>-auth-token` cookie.
  const projectRef = supabaseUrl.split('.')[0].replace('https://', '').replace('http://', '');
  const cookieName = `sb-${projectRef}-auth-token`;
  const tokenValue = JSON.stringify([authData.access_token, authData.refresh_token ?? null]);
  cookies.set(cookieName, tokenValue, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
  });

  // Look up the role for audit logging.
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', authData.user.id)
    .single<{ role: string; full_name: string }>();

  await admin.from('activity_log').insert({
    actor_id: authData.user.id,
    action: 'login',
    entity_type: 'auth',
    entity_id: authData.user.id,
    summary: `login ${authData.user.email}`,
    ip,
    user_agent: request.headers.get('user-agent'),
  });

  return json({
    ok: true,
    user: { id: authData.user.id, email: authData.user.email },
    role: profile?.role ?? 'editor',
    full_name: profile?.full_name ?? '',
  });
};
