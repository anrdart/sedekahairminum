import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServer } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/supabase/env';
import type { Role } from '@/lib/supabase/types';

// Routes under /admin that require an admin/owner role (not just editor).
const ADMIN_ONLY_PREFIXES = ['/admin/settings', '/admin/users', '/admin/activity', '/admin/submissions'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, locals, url, redirect, request } = context;
  const runtimeEnv = locals.runtime?.env as Record<string, string> | undefined;

  const path = url.pathname;
  const needsAuth = path.startsWith('/admin') && path !== '/admin/login';
  const isLogin = path === '/admin/login';
  const isApi = path.startsWith('/api/');
  // SSR routes that need a Supabase client (blog, RSS, sitemap, admin, API).
  const isSsr = needsAuth || isLogin || isApi
    || path.startsWith('/artikel') || path.startsWith('/rss') || path.startsWith('/sitemap-articles');

  // Prerendered marketing pages never need a request-bound client. Skip when
  // env is missing (fresh clone) or the route is static.
  const { url: supaUrl, anonKey } = publicEnv(runtimeEnv);
  if (!isSsr || !supaUrl || !anonKey) {
    return next();
  }

  const supabase = createSupabaseServer(cookies, runtimeEnv, request.headers.get('cookie'));
  locals.supabase = supabase;
  locals.user = null;
  locals.role = null;

  // Only check auth for admin / API routes (not public blog).
  if (needsAuth || isLogin || isApi) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    return redirect(`/admin/login?next=${encodeURIComponent(path)}`);
  }
  if (needsAuth && ADMIN_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
    if (locals.role !== 'owner' && locals.role !== 'admin') {
      return redirect('/admin?error=forbidden');
    }
  }
  if (isLogin && locals.user) {
    return redirect('/admin');
  }

  return next();
});
