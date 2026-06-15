import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServer } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/supabase/env';
import type { Role } from '@/lib/supabase/types';

const ADMIN_ONLY_PREFIXES = ['/admin/settings', '/admin/users', '/admin/activity', '/admin/submissions'];

/** Security headers applied to admin HTML responses. */
function applySecurityHeaders(response: Response, path: string): Response {
  if (path.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer');
  }
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, locals, url, redirect, request } = context;
  const runtimeEnv = locals.runtime?.env as Record<string, string> | undefined;

  const path = url.pathname;
  const needsAuth = path.startsWith('/admin') && path !== '/admin/login';
  const isLogin = path === '/admin/login';
  const isApi = path.startsWith('/api/');
  const isSsr = needsAuth || isLogin || isApi
    || path.startsWith('/artikel') || path.startsWith('/rss') || path.startsWith('/sitemap-articles');

  const { url: supaUrl, anonKey } = publicEnv(runtimeEnv);
  if (!isSsr || !supaUrl || !anonKey) {
    const response = await next();
    return applySecurityHeaders(response, path);
  }

  const supabase = createSupabaseServer(cookies, runtimeEnv, request.headers.get('cookie'));
  locals.supabase = supabase;
  locals.user = null;
  locals.role = null;

  if (needsAuth || isLogin || isApi) {
    const { data: { user } } = await supabase.auth.getUser();
    locals.user = user ?? null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single<{ role: Role }>();
      locals.role = profile?.role ?? null;
    }
  }

  if (needsAuth && !locals.user) {
    // Open-redirect guard: include search string, drop any protocol-relative
    // path the browser might try to interpret as off-site.
    const next = url.pathname + url.search;
    return redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }
  if (needsAuth && ADMIN_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
    if (locals.role !== 'owner' && locals.role !== 'admin') {
      return redirect('/admin?error=forbidden');
    }
  }
  if (isLogin && locals.user) {
    return redirect('/admin');
  }

  const response = await next();
  return applySecurityHeaders(response, path);
});
